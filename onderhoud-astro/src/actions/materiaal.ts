import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/context";
import { vereisBeheerder, vereisMedewerker } from "@/lib/guard";
import { beheerlog, categorieen, materiaal, onderdelen, velddefinities } from "@/db/schema";
import { nieuwId } from "@/lib/id";

/**
 * Zoekt een gescand of ingetypt Materiaal-ID binnen één onderdeel. Geeft null
 * als het niet bestaat — de scanpagina toont dan een melding en navigeert
 * bewust niet automatisch door.
 */
export const zoekMateriaalId = defineAction({
  input: z.object({ onderdeelId: z.string().min(1), ruwId: z.string() }),
  handler: async ({ onderdeelId, ruwId }, context) => {
    await vereisMedewerker(context);
    const materiaalId = ruwId.trim().toUpperCase();
    if (!materiaalId) return { materiaalId: null };

    const gevonden = await db().query.materiaal.findFirst({
      where: and(eq(materiaal.onderdeelId, onderdeelId), eq(materiaal.materiaalId, materiaalId)),
      columns: { materiaalId: true },
    });
    return { materiaalId: gevonden?.materiaalId ?? null };
  },
});

export const maakMateriaal = defineAction({
  accept: "form",
  input: z.object({
    onderdeelId: z.string().min(1),
    categorieId: z.string().min(1),
    // Het ID moet exact overeenkomen met de sticker; nooit automatisch genereren.
    materiaalId: z.string().trim().min(1).max(40),
    merkModel: z.string().trim().min(1).max(160),
    locatie: z.string().trim().max(120).optional(),
    inGebruikSinds: z.coerce.date(),
  }),
  handler: async (invoer, context) => {
    await vereisMedewerker(context);
    const materiaalId = invoer.materiaalId.toUpperCase();

    const [onderdeel, categorie, bestaat] = await Promise.all([
      db().query.onderdelen.findFirst({ where: eq(onderdelen.id, invoer.onderdeelId) }),
      db().query.categorieen.findFirst({ where: eq(categorieen.id, invoer.categorieId) }),
      db().query.materiaal.findFirst({
        where: and(
          eq(materiaal.onderdeelId, invoer.onderdeelId),
          eq(materiaal.materiaalId, materiaalId)
        ),
      }),
    ]);

    if (!onderdeel) throw new ActionError({ code: "NOT_FOUND", message: "Onderdeel niet gevonden." });
    if (!categorie || categorie.onderdeelId !== onderdeel.id) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Onbekende categorie voor dit onderdeel.",
      });
    }
    if (bestaat) {
      throw new ActionError({
        code: "CONFLICT",
        message: `Materiaal-ID "${materiaalId}" bestaat al in ${onderdeel.naam}.`,
      });
    }

    // Nieuw materiaal start altijd op "In gebruik"; er is geen statusveld.
    await db()
      .insert(materiaal)
      .values({
        id: nieuwId("mat"),
        materiaalId,
        onderdeelId: onderdeel.id,
        categorieId: categorie.id,
        merkModel: invoer.merkModel,
        locatie: invoer.locatie ?? "",
        inGebruikSinds: invoer.inGebruikSinds,
        status: "IN_GEBRUIK",
        veldwaarden: "{}",
        aangemaakt: new Date(),
      });

    return { slug: onderdeel.slug, materiaalId };
  },
});

/** Bewerkt de algemene gegevens plus de categorie-eigen velden. */
export const bewerkMateriaal = defineAction({
  accept: "form",
  input: z
    .object({
      materiaalDbId: z.string().min(1),
      merkModel: z.string().trim().min(1).max(160),
      locatie: z.string().trim().max(120).optional(),
      inGebruikSinds: z.coerce.date(),
    })
    // De categorie-eigen velden komen binnen als veld:{id}; die staan niet vast.
    .catchall(z.string().optional()),
  handler: async (invoer, context) => {
    await vereisMedewerker(context);

    const stuk = await db().query.materiaal.findFirst({
      where: eq(materiaal.id, invoer.materiaalDbId),
    });
    if (!stuk) throw new ActionError({ code: "NOT_FOUND", message: "Materiaal niet gevonden." });

    const velden = await db()
      .select()
      .from(velddefinities)
      .where(
        and(eq(velddefinities.categorieId, stuk.categorieId), isNull(velddefinities.archivedAt))
      );

    const veldwaarden: Record<string, string> = {};
    for (const veld of velden) {
      const waarde = invoer[`veld:${veld.id}`];
      if (typeof waarde === "string" && waarde.trim()) veldwaarden[veld.id] = waarde.trim();
    }

    await db()
      .update(materiaal)
      .set({
        merkModel: invoer.merkModel,
        locatie: invoer.locatie ?? "",
        inGebruikSinds: invoer.inGebruikSinds,
        veldwaarden: JSON.stringify(veldwaarden),
      })
      .where(eq(materiaal.id, stuk.id));

    return { ok: true as const };
  },
});

export const verwijderMateriaal = defineAction({
  accept: "form",
  input: z.object({ materiaalDbId: z.string().min(1) }),
  handler: async ({ materiaalDbId }, context) => {
    const beheerder = await vereisBeheerder(context);

    const stuk = await db().query.materiaal.findFirst({ where: eq(materiaal.id, materiaalDbId) });
    if (!stuk) throw new ActionError({ code: "NOT_FOUND", message: "Materiaal niet gevonden." });

    const onderdeel = await db().query.onderdelen.findFirst({
      where: eq(onderdelen.id, stuk.onderdeelId),
    });

    // D1 kent geen interactieve transacties; batch() voert alles in één keer uit.
    await db().batch([
      db().delete(materiaal).where(eq(materiaal.id, stuk.id)),
      db().insert(beheerlog).values({
        id: nieuwId("bl"),
        medewerkerId: beheerder.id,
        wat: "Materiaal verwijderd",
        detail: JSON.stringify({ materiaalId: stuk.materiaalId, merkModel: stuk.merkModel }),
        tijdstip: new Date(),
      }),
    ]);

    return { slug: onderdeel?.slug ?? "" };
  },
});

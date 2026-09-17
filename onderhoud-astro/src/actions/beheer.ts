import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { and, count, eq } from "drizzle-orm";

import { db } from "@/lib/context";
import { vereisBeheerder } from "@/lib/guard";
import { hashWachtwoord } from "@/lib/wachtwoord";
import { nieuwId } from "@/lib/id";
import {
  beheerlog,
  categorieen,
  medewerkers,
  onderdelen,
  onderhoudsacties,
  velddefinities,
  ROLLEN,
  VELDTYPES,
} from "@/db/schema";

async function logBeheer(medewerkerId: string, wat: string, detail: object) {
  await db().insert(beheerlog).values({
    id: nieuwId("bl"),
    medewerkerId,
    wat,
    detail: JSON.stringify(detail),
    tijdstip: new Date(),
  });
}

/* ---------- categorieën ---------- */

export const voegCategorieToe = defineAction({
  accept: "form",
  input: z.object({ onderdeelId: z.string().min(1), naam: z.string().trim().min(1).max(60) }),
  handler: async ({ onderdeelId, naam }, context) => {
    const beheerder = await vereisBeheerder(context);

    const onderdeel = await db().query.onderdelen.findFirst({
      where: eq(onderdelen.id, onderdeelId),
    });
    if (!onderdeel) throw new ActionError({ code: "NOT_FOUND", message: "Onderdeel niet gevonden." });

    const bestaat = await db().query.categorieen.findFirst({
      where: and(eq(categorieen.onderdeelId, onderdeel.id), eq(categorieen.naam, naam)),
    });

    if (bestaat) {
      if (!bestaat.archivedAt) {
        throw new ActionError({ code: "CONFLICT", message: "Deze categorie bestaat al." });
      }
      // Een gearchiveerde categorie met dezelfde naam komt terug in plaats van
      // dat er een tweede naast ontstaat.
      await db()
        .update(categorieen)
        .set({ archivedAt: null })
        .where(eq(categorieen.id, bestaat.id));
    } else {
      const [{ aantal }] = await db()
        .select({ aantal: count() })
        .from(categorieen)
        .where(eq(categorieen.onderdeelId, onderdeel.id));
      await db().insert(categorieen).values({
        id: nieuwId("cat"),
        onderdeelId: onderdeel.id,
        naam,
        sortering: aantal,
      });
    }

    await logBeheer(beheerder.id, "Categorie toegevoegd", { naam });
    return { ok: true as const };
  },
});

/** Verwijderen is archiveren: bestaande logregels blijven ongemoeid. */
export const archiveerCategorie = defineAction({
  accept: "form",
  input: z.object({ categorieId: z.string().min(1) }),
  handler: async ({ categorieId }, context) => {
    const beheerder = await vereisBeheerder(context);
    const categorie = await db().query.categorieen.findFirst({
      where: eq(categorieen.id, categorieId),
    });
    if (!categorie) return { ok: false as const };

    await db()
      .update(categorieen)
      .set({ archivedAt: new Date() })
      .where(eq(categorieen.id, categorieId));
    await logBeheer(beheerder.id, "Categorie gearchiveerd", { naam: categorie.naam });
    return { ok: true as const };
  },
});

/* ---------- onderhoudsacties ---------- */

export const voegActieToe = defineAction({
  accept: "form",
  input: z.object({ categorieId: z.string().min(1), naam: z.string().trim().min(1).max(80) }),
  handler: async ({ categorieId, naam }, context) => {
    const beheerder = await vereisBeheerder(context);

    const categorie = await db().query.categorieen.findFirst({
      where: eq(categorieen.id, categorieId),
    });
    if (!categorie) throw new ActionError({ code: "NOT_FOUND", message: "Categorie niet gevonden." });

    const bestaand = await db().query.onderhoudsacties.findFirst({
      where: and(eq(onderhoudsacties.categorieId, categorie.id), eq(onderhoudsacties.naam, naam)),
    });
    if (bestaand && !bestaand.archivedAt) {
      throw new ActionError({ code: "CONFLICT", message: "Deze actie bestaat al." });
    }

    if (bestaand) {
      await db()
        .update(onderhoudsacties)
        .set({ archivedAt: null })
        .where(eq(onderhoudsacties.id, bestaand.id));
    } else {
      const [{ aantal }] = await db()
        .select({ aantal: count() })
        .from(onderhoudsacties)
        .where(eq(onderhoudsacties.categorieId, categorie.id));
      await db().insert(onderhoudsacties).values({
        id: nieuwId("act"),
        categorieId: categorie.id,
        naam,
        sortering: aantal,
      });
    }

    await logBeheer(beheerder.id, "Onderhoudsactie toegevoegd", {
      categorie: categorie.naam,
      naam,
    });
    return { ok: true as const };
  },
});

export const archiveerActie = defineAction({
  accept: "form",
  input: z.object({ actieId: z.string().min(1) }),
  handler: async ({ actieId }, context) => {
    const beheerder = await vereisBeheerder(context);
    const actie = await db().query.onderhoudsacties.findFirst({
      where: eq(onderhoudsacties.id, actieId),
    });
    if (!actie) return { ok: false as const };

    await db()
      .update(onderhoudsacties)
      .set({ archivedAt: new Date() })
      .where(eq(onderhoudsacties.id, actieId));
    await logBeheer(beheerder.id, "Onderhoudsactie gearchiveerd", { naam: actie.naam });
    return { ok: true as const };
  },
});

/* ---------- velddefinities ---------- */

export const voegVeldToe = defineAction({
  accept: "form",
  input: z.object({
    categorieId: z.string().min(1),
    naam: z.string().trim().min(1).max(80),
    type: z.enum(VELDTYPES).default("TEKST"),
    eenheid: z.string().trim().max(12).optional(),
  }),
  handler: async ({ categorieId, naam, type, eenheid }, context) => {
    const beheerder = await vereisBeheerder(context);

    const categorie = await db().query.categorieen.findFirst({
      where: eq(categorieen.id, categorieId),
    });
    if (!categorie) throw new ActionError({ code: "NOT_FOUND", message: "Categorie niet gevonden." });

    const bestaand = await db().query.velddefinities.findFirst({
      where: and(eq(velddefinities.categorieId, categorie.id), eq(velddefinities.naam, naam)),
    });
    if (bestaand && !bestaand.archivedAt) {
      throw new ActionError({ code: "CONFLICT", message: "Dit veld bestaat al." });
    }

    if (bestaand) {
      await db()
        .update(velddefinities)
        .set({ archivedAt: null, type, eenheid: eenheid ?? null })
        .where(eq(velddefinities.id, bestaand.id));
    } else {
      const [{ aantal }] = await db()
        .select({ aantal: count() })
        .from(velddefinities)
        .where(eq(velddefinities.categorieId, categorie.id));
      await db().insert(velddefinities).values({
        id: nieuwId("veld"),
        categorieId: categorie.id,
        naam,
        type,
        eenheid: eenheid ?? null,
        sortering: aantal,
      });
    }

    await logBeheer(beheerder.id, "Veld toegevoegd", { categorie: categorie.naam, naam });
    return { ok: true as const };
  },
});

export const archiveerVeld = defineAction({
  accept: "form",
  input: z.object({ veldId: z.string().min(1) }),
  handler: async ({ veldId }, context) => {
    const beheerder = await vereisBeheerder(context);
    const veld = await db().query.velddefinities.findFirst({
      where: eq(velddefinities.id, veldId),
    });
    if (!veld) return { ok: false as const };

    await db()
      .update(velddefinities)
      .set({ archivedAt: new Date() })
      .where(eq(velddefinities.id, veldId));
    await logBeheer(beheerder.id, "Veld gearchiveerd", { naam: veld.naam });
    return { ok: true as const };
  },
});

/* ---------- medewerkers ---------- */

export const voegMedewerkerToe = defineAction({
  accept: "form",
  input: z.object({
    naam: z.string().trim().min(1).max(80),
    gebruikersnaam: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .transform((v) => v.toLowerCase()),
    wachtwoord: z.string().min(8).max(100),
    rol: z.enum(ROLLEN),
    functie: z.string().trim().max(80).optional(),
  }),
  handler: async ({ naam, gebruikersnaam, wachtwoord, rol, functie }, context) => {
    const beheerder = await vereisBeheerder(context);

    const bestaat = await db().query.medewerkers.findFirst({
      where: eq(medewerkers.gebruikersnaam, gebruikersnaam),
    });
    if (bestaat) {
      throw new ActionError({ code: "CONFLICT", message: "Deze gebruikersnaam is al in gebruik." });
    }

    await db().insert(medewerkers).values({
      id: nieuwId("mw"),
      naam,
      gebruikersnaam,
      wachtwoordHash: await hashWachtwoord(wachtwoord),
      rol,
      functie: functie ?? "",
      actief: true,
      aangemaakt: new Date(),
    });

    await logBeheer(beheerder.id, "Medewerker toegevoegd", { naam });
    return { ok: true as const };
  },
});

export const zetMedewerkerActief = defineAction({
  accept: "form",
  input: z.object({
    medewerkerId: z.string().min(1),
    actief: z.coerce.boolean(),
  }),
  handler: async ({ medewerkerId, actief }, context) => {
    const beheerder = await vereisBeheerder(context);
    // Jezelf deactiveren zou je meteen buitensluiten.
    if (medewerkerId === beheerder.id) return { ok: false as const };

    const medewerker = await db().query.medewerkers.findFirst({
      where: eq(medewerkers.id, medewerkerId),
    });
    if (!medewerker) return { ok: false as const };

    await db().update(medewerkers).set({ actief }).where(eq(medewerkers.id, medewerkerId));
    await logBeheer(
      beheerder.id,
      actief ? "Medewerker geactiveerd" : "Medewerker gedeactiveerd",
      { naam: medewerker.naam }
    );
    return { ok: true as const };
  },
});

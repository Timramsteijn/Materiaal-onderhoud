import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/context";
import { vereisMedewerker } from "@/lib/guard";
import { materiaal, onderhoudsacties, onderhoudsverzoeken } from "@/db/schema";
import { nieuwId } from "@/lib/id";

/**
 * Melden dat er iets moet gebeuren. Dit is géén registratie: pas als de
 * werkplaats het onderhoud uitvoert komt er een regel in het log. Zo staat
 * eenzelfde slijpbeurt niet twee keer in de cijfers.
 */
export const meldOnderhoudNodig = defineAction({
  accept: "form",
  input: z.object({
    materiaalDbId: z.string().min(1),
    actieId: z.string().min(1),
    opmerking: z.string().trim().max(2000).optional(),
    /** Idempotentiesleutel, net als bij een registratie. */
    clientId: z.string().min(1).max(100),
  }),
  handler: async (invoer, context) => {
    const medewerker = await vereisMedewerker(context);

    const bestaand = await db().query.onderhoudsverzoeken.findFirst({
      where: eq(onderhoudsverzoeken.clientId, invoer.clientId),
    });
    if (bestaand) return { gemeld: true, dubbel: false };

    const stuk = await db().query.materiaal.findFirst({
      where: eq(materiaal.id, invoer.materiaalDbId),
    });
    if (!stuk) throw new ActionError({ code: "NOT_FOUND", message: "Materiaal niet gevonden." });

    const actie = await db().query.onderhoudsacties.findFirst({
      where: and(
        eq(onderhoudsacties.id, invoer.actieId),
        eq(onderhoudsacties.categorieId, stuk.categorieId),
        isNull(onderhoudsacties.archivedAt)
      ),
    });
    if (!actie) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Onbekende onderhoudsactie voor deze categorie.",
      });
    }
    // Afkeuren is een eigen route met goedkeuring door beheer; dat meld je niet.
    if (actie.isAfkeuren) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Afkeuren loopt via 'Onderhoud registreren', niet via een melding.",
      });
    }

    // Staat dezelfde actie al open, dan is een tweede melding alleen ruis.
    const alOpen = await db().query.onderhoudsverzoeken.findFirst({
      where: and(
        eq(onderhoudsverzoeken.materiaalDbId, stuk.id),
        eq(onderhoudsverzoeken.actieId, actie.id),
        eq(onderhoudsverzoeken.status, "OPEN")
      ),
    });
    if (alOpen) return { gemeld: false, dubbel: true };

    await db().insert(onderhoudsverzoeken).values({
      id: nieuwId("vzk"),
      materiaalDbId: stuk.id,
      actieNaam: actie.naam,
      actieId: actie.id,
      opmerking: invoer.opmerking ?? "",
      status: "OPEN",
      gemeldDoorId: medewerker.id,
      gemeldDoorNaam: medewerker.naam,
      gemeldOp: new Date(),
      clientId: invoer.clientId,
    });

    return { gemeld: true, dubbel: false };
  },
});

/**
 * Melding intrekken: bij nader inzien hoeft het niet, of iemand meldde het
 * dubbel. Het verzoek verdwijnt niet, het krijgt de status "vervallen".
 */
export const laatVerzoekVervallen = defineAction({
  accept: "form",
  input: z.object({ verzoekId: z.string().min(1) }),
  handler: async ({ verzoekId }, context) => {
    const medewerker = await vereisMedewerker(context);

    const verzoek = await db().query.onderhoudsverzoeken.findFirst({
      where: eq(onderhoudsverzoeken.id, verzoekId),
    });
    if (!verzoek) throw new ActionError({ code: "NOT_FOUND", message: "Melding niet gevonden." });
    if (verzoek.status !== "OPEN") return { ok: false as const };

    await db()
      .update(onderhoudsverzoeken)
      .set({
        status: "VERVALLEN",
        afgehandeldDoorNaam: medewerker.naam,
        afgehandeldOp: new Date(),
      })
      .where(eq(onderhoudsverzoeken.id, verzoek.id));

    return { ok: true as const };
  },
});

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/context";
import { vereisBeheerder, vereisMedewerker } from "@/lib/guard";
import {
  beheerlog,
  logregels,
  materiaal,
  onderhoudsacties,
  onderhoudsverzoeken,
  type Status,
} from "@/db/schema";
import { nieuwId } from "@/lib/id";

/**
 * Registreert onderhoud. Kiest de medewerker de afkeuractie, dan wordt dit een
 * aanvraag: het materiaal gaat naar "Ter goedkeuring" en blijft uit de verhuur
 * tot een beheerder de afkeuring bevestigt.
 */
export const registreerOnderhoud = defineAction({
  accept: "form",
  input: z.object({
    materiaalDbId: z.string().min(1),
    actieId: z.string().min(1),
    opmerking: z.string().trim().max(2000).optional(),
    nieuweStatus: z.enum(["IN_GEBRUIK", "IN_REPARATIE", "BUITEN_GEBRUIK"]).optional(),
    /** Meldingen die met deze registratie zijn afgehandeld. */
    verzoekIds: z.array(z.string()).optional(),
    /** Idempotentiesleutel; laat de offline wachtrij veilig opnieuw versturen. */
    clientId: z.string().min(1).max(100),
  }),
  handler: async (invoer, context) => {
    const medewerker = await vereisMedewerker(context);

    // Idempotent: dezelfde clientId levert nooit een tweede logregel op.
    const bestaand = await db().query.logregels.findFirst({
      where: eq(logregels.clientId, invoer.clientId),
      columns: { soort: true },
    });
    if (bestaand) {
      return {
        opgeslagen: true,
        afkeuringAangevraagd: bestaand.soort === "AFKEURING_AANGEVRAAGD",
      };
    }

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

    const nu = new Date();
    const isAfkeuring = actie.isAfkeuren;
    const logId = nieuwId("log");

    // Alleen open meldingen van dit materiaal; een id uit een ander formulier
    // sluiten we hier stil buiten in plaats van de registratie te weigeren.
    const afTeRonden = invoer.verzoekIds?.length
      ? await db()
          .select({ id: onderhoudsverzoeken.id })
          .from(onderhoudsverzoeken)
          .where(
            and(
              eq(onderhoudsverzoeken.materiaalDbId, stuk.id),
              eq(onderhoudsverzoeken.status, "OPEN"),
              inArray(onderhoudsverzoeken.id, invoer.verzoekIds)
            )
          )
      : [];

    // Bij een afkeuraanvraag bepaalt de flow de status, niet de keuze in het formulier.
    const nieuweStatus: Status | null = isAfkeuring
      ? "TER_GOEDKEURING"
      : (invoer.nieuweStatus ?? null);

    await db().batch([
      db().insert(logregels).values({
        id: logId,
        materiaalDbId: stuk.id,
        actieNaam: actie.naam,
        actieId: actie.id,
        opmerking: invoer.opmerking ?? "",
        statusNa: nieuweStatus,
        medewerkerId: medewerker.id,
        medewerkerNaam: medewerker.naam,
        tijdstip: nu,
        soort: isAfkeuring ? "AFKEURING_AANGEVRAAGD" : "REGISTRATIE",
        clientId: invoer.clientId,
      }),
      db()
        .update(materiaal)
        .set({
          laatsteOnderhoud: nu,
          aantalBeurten: sql`${materiaal.aantalBeurten} + 1`,
          ...(isAfkeuring
            ? {
                status: "TER_GOEDKEURING" as const,
                // Onthouden waar we naar terugdraaien als de aanvraag wordt afgewezen.
                statusVoorKeuring:
                  stuk.status === "TER_GOEDKEURING" ? stuk.statusVoorKeuring : stuk.status,
              }
            : nieuweStatus
              ? { status: nieuweStatus }
              : {}),
        })
        .where(eq(materiaal.id, stuk.id)),
      ...(afTeRonden.length
        ? [
            db()
              .update(onderhoudsverzoeken)
              .set({
                status: "AFGEROND" as const,
                afgehandeldDoorNaam: medewerker.naam,
                afgehandeldOp: nu,
                logregelId: logId,
              })
              .where(
                inArray(
                  onderhoudsverzoeken.id,
                  afTeRonden.map((v) => v.id)
                )
              ),
          ]
        : []),
    ]);

    return {
      opgeslagen: true,
      afkeuringAangevraagd: isAfkeuring,
      afgerondeMeldingen: afTeRonden.length,
    };
  },
});

/** Beheerder bevestigt de afkeuring: het materiaal gaat definitief uit de verhuur. */
export const keurAfkeuringGoed = defineAction({
  accept: "form",
  input: z.object({ materiaalDbId: z.string().min(1) }),
  handler: async ({ materiaalDbId }, context) => {
    const beheerder = await vereisBeheerder(context);

    const stuk = await db().query.materiaal.findFirst({ where: eq(materiaal.id, materiaalDbId) });
    if (!stuk || stuk.status !== "TER_GOEDKEURING") return { ok: false as const };

    await db().batch([
      db()
        .update(materiaal)
        .set({ status: "BUITEN_GEBRUIK", statusVoorKeuring: null })
        .where(eq(materiaal.id, stuk.id)),
      db().insert(logregels).values({
        id: nieuwId("log"),
        materiaalDbId: stuk.id,
        actieNaam: "Afkeuring goedgekeurd",
        opmerking: "",
        statusNa: "BUITEN_GEBRUIK",
        medewerkerId: beheerder.id,
        medewerkerNaam: beheerder.naam,
        tijdstip: new Date(),
        soort: "AFKEURING_GOEDGEKEURD",
        clientId: `keuring:goed:${stuk.id}:${Date.now()}`,
      }),
      db().insert(beheerlog).values({
        id: nieuwId("bl"),
        medewerkerId: beheerder.id,
        wat: "Afkeuring goedgekeurd",
        detail: JSON.stringify({ materiaalId: stuk.materiaalId }),
        tijdstip: new Date(),
      }),
    ]);

    return { ok: true as const };
  },
});

/** Beheerder wijst de afkeuring af: het materiaal keert terug naar de vorige status. */
export const wijsAfkeuringAf = defineAction({
  accept: "form",
  input: z.object({ materiaalDbId: z.string().min(1) }),
  handler: async ({ materiaalDbId }, context) => {
    const beheerder = await vereisBeheerder(context);

    const stuk = await db().query.materiaal.findFirst({ where: eq(materiaal.id, materiaalDbId) });
    if (!stuk || stuk.status !== "TER_GOEDKEURING") return { ok: false as const };

    const terug: Status = stuk.statusVoorKeuring ?? "IN_GEBRUIK";

    await db().batch([
      db()
        .update(materiaal)
        .set({ status: terug, statusVoorKeuring: null })
        .where(eq(materiaal.id, stuk.id)),
      db().insert(logregels).values({
        id: nieuwId("log"),
        materiaalDbId: stuk.id,
        actieNaam: "Afkeuring afgewezen",
        opmerking: "",
        statusNa: terug,
        medewerkerId: beheerder.id,
        medewerkerNaam: beheerder.naam,
        tijdstip: new Date(),
        soort: "AFKEURING_AFGEWEZEN",
        clientId: `keuring:afgewezen:${stuk.id}:${Date.now()}`,
      }),
      db().insert(beheerlog).values({
        id: nieuwId("bl"),
        medewerkerId: beheerder.id,
        wat: "Afkeuring afgewezen",
        detail: JSON.stringify({ materiaalId: stuk.materiaalId }),
        tijdstip: new Date(),
      }),
    ]);

    return { ok: true as const };
  },
});

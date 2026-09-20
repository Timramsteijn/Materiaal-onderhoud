import { and, asc, count, desc, eq } from "drizzle-orm";

import { db } from "./context";
import { materiaal, onderhoudsverzoeken } from "../db/schema";

/** Open meldingen van één stuk materiaal, oudste eerst. */
export async function haalOpenVerzoeken(materiaalDbId: string) {
  return db()
    .select()
    .from(onderhoudsverzoeken)
    .where(
      and(
        eq(onderhoudsverzoeken.materiaalDbId, materiaalDbId),
        eq(onderhoudsverzoeken.status, "OPEN")
      )
    )
    .orderBy(asc(onderhoudsverzoeken.gemeldOp));
}

/** Alle open meldingen binnen een onderdeel, nieuwste eerst. */
export async function haalOpenVerzoekenVanOnderdeel(onderdeelId: string) {
  return db()
    .select({
      id: onderhoudsverzoeken.id,
      actieNaam: onderhoudsverzoeken.actieNaam,
      opmerking: onderhoudsverzoeken.opmerking,
      gemeldDoorNaam: onderhoudsverzoeken.gemeldDoorNaam,
      gemeldOp: onderhoudsverzoeken.gemeldOp,
      materiaalId: materiaal.materiaalId,
      merkModel: materiaal.merkModel,
    })
    .from(onderhoudsverzoeken)
    .innerJoin(materiaal, eq(materiaal.id, onderhoudsverzoeken.materiaalDbId))
    .where(and(eq(materiaal.onderdeelId, onderdeelId), eq(onderhoudsverzoeken.status, "OPEN")))
    .orderBy(desc(onderhoudsverzoeken.gemeldOp));
}

/** Aantal open meldingen per stuk materiaal, voor de badges in de lijst. */
export async function telOpenVerzoeken(onderdeelId: string): Promise<Map<string, number>> {
  const rijen = await db()
    .select({ materiaalDbId: onderhoudsverzoeken.materiaalDbId, aantal: count() })
    .from(onderhoudsverzoeken)
    .innerJoin(materiaal, eq(materiaal.id, onderhoudsverzoeken.materiaalDbId))
    .where(and(eq(materiaal.onderdeelId, onderdeelId), eq(onderhoudsverzoeken.status, "OPEN")))
    .groupBy(onderhoudsverzoeken.materiaalDbId);

  return new Map(rijen.map((r) => [r.materiaalDbId, r.aantal]));
}

export type OpenVerzoek = Awaited<ReturnType<typeof haalOpenVerzoeken>>[number];

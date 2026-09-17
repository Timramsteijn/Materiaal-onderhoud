import { and, asc, count, eq, like, or, sql } from "drizzle-orm";

import { db } from "./context";
import { categorieen, materiaal } from "../db/schema";

export type LijstFilters = { q?: string; categorie?: string };

/** Materiaal van één onderdeel, gefilterd op zoekterm en categorie. */
export async function haalMateriaal(onderdeelId: string, filters: LijstFilters) {
  const q = filters.q?.trim();
  // SQLite's LIKE is van zichzelf hoofdletterongevoelig voor ASCII; lower()
  // maakt het ook voor accenten voorspelbaar.
  const zoek = q ? `%${q.toLowerCase()}%` : undefined;

  const voorwaarden = [
    eq(materiaal.onderdeelId, onderdeelId),
    ...(filters.categorie ? [eq(materiaal.categorieId, filters.categorie)] : []),
    ...(zoek
      ? [
          or(
            like(sql`lower(${materiaal.materiaalId})`, zoek),
            like(sql`lower(${materiaal.merkModel})`, zoek)
          )!,
        ]
      : []),
  ];

  const [totaal, rijen] = await Promise.all([
    db().select({ aantal: count() }).from(materiaal).where(eq(materiaal.onderdeelId, onderdeelId)),
    db()
      .select({
        id: materiaal.id,
        materiaalId: materiaal.materiaalId,
        merkModel: materiaal.merkModel,
        locatie: materiaal.locatie,
        status: materiaal.status,
        laatsteOnderhoud: materiaal.laatsteOnderhoud,
        categorieNaam: categorieen.naam,
      })
      .from(materiaal)
      .innerJoin(categorieen, eq(categorieen.id, materiaal.categorieId))
      .where(and(...voorwaarden))
      .orderBy(asc(materiaal.materiaalId)),
  ]);

  return { totaal: totaal[0]?.aantal ?? 0, materiaal: rijen };
}

export type MateriaalRij = Awaited<ReturnType<typeof haalMateriaal>>["materiaal"][number];

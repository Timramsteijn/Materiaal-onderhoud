import { and, asc, count, eq, like, or, sql } from "drizzle-orm";

import { db } from "./context";
import { categorieen, materiaal } from "../db/schema";
import { heeftAandachtNodig } from "./domein";
import { telOpenVerzoeken } from "./verzoeken";

export type LijstFilters = {
  q?: string;
  categorie?: string;
  aandacht?: boolean;
  /** Alleen materiaal waarvoor onderhoud is gemeld. */
  gemeld?: boolean;
};

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

  const [totaal, rijen, openMeldingen] = await Promise.all([
    db().select({ aantal: count() }).from(materiaal).where(eq(materiaal.onderdeelId, onderdeelId)),
    db()
      .select({
        id: materiaal.id,
        materiaalId: materiaal.materiaalId,
        merkModel: materiaal.merkModel,
        locatie: materiaal.locatie,
        status: materiaal.status,
        laatsteOnderhoud: materiaal.laatsteOnderhoud,
        inGebruikSinds: materiaal.inGebruikSinds,
        categorieNaam: categorieen.naam,
      })
      .from(materiaal)
      .innerJoin(categorieen, eq(categorieen.id, materiaal.categorieId))
      .where(and(...voorwaarden))
      .orderBy(asc(materiaal.materiaalId)),
    telOpenVerzoeken(onderdeelId),
  ]);

  const metMeldingen = rijen.map((r) => ({ ...r, meldingen: openMeldingen.get(r.id) ?? 0 }));

  // Het aandacht-filter draait bewust in JavaScript: zo beslist overal exact
  // dezelfde functie wie aandacht nodig heeft — overzicht, badge en lijst.
  const gefilterd = metMeldingen
    .filter((r) => !filters.aandacht || heeftAandachtNodig(r.laatsteOnderhoud, r.inGebruikSinds))
    .filter((r) => !filters.gemeld || r.meldingen > 0);

  return { totaal: totaal[0]?.aantal ?? 0, materiaal: gefilterd };
}

export type MateriaalRij = Awaited<ReturnType<typeof haalMateriaal>>["materiaal"][number];

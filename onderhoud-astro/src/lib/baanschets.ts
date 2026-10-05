import { asc, eq } from "drizzle-orm";

import { db } from "./context";
import {
  baanschetsCellen,
  baanschetsInstellingen,
  baanschetsSecties,
  baanschetsSectieBereiken,
  BAANSCHETS_CATEGORIEEN,
  type BaanschetsCategorie,
} from "../db/schema";
import { BAANSCHETS_LEGENDA, BAANSCHETS_SKI_KEYS } from "./domein";

const INSTELLINGEN_ID = "singleton";

/** Haalt de ene instellingenrij op; maakt 'm aan met standaardwaarden als die nog niet bestaat. */
export async function haalBaanschetsInstellingen() {
  const bestaand = await db().query.baanschetsInstellingen.findFirst({
    where: eq(baanschetsInstellingen.id, INSTELLINGEN_ID),
  });
  if (bestaand) return bestaand;

  const nieuw = {
    id: INSTELLINGEN_ID,
    breedteM: 2.17,
    hoogteM: 1.45,
    basisleeftijdSeizoenen: 6,
    aantalRijen: 40,
    aantalKolommen: 40,
  };
  await db().insert(baanschetsInstellingen).values(nieuw);
  return nieuw;
}

export async function haalBaanschetsCellen() {
  return db().select().from(baanschetsCellen);
}

export async function haalBaanschetsSecties() {
  const [secties, bereiken] = await Promise.all([
    db().select().from(baanschetsSecties).orderBy(asc(baanschetsSecties.nr)),
    db().select().from(baanschetsSectieBereiken),
  ]);
  return secties.map((s) => ({
    ...s,
    bereiken: bereiken.filter((b) => b.sectieId === s.id),
  }));
}

export type BaanschetsSectieMetBereiken = Awaited<
  ReturnType<typeof haalBaanschetsSecties>
>[number];

/** Alle (rij, kolom)-combinaties van een sectie, voor telling en highlight. */
export function sectiePosities(
  sectie: Pick<BaanschetsSectieMetBereiken, "bereiken">
): Set<string> {
  const posities = new Set<string>();
  for (const b of sectie.bereiken) {
    for (let r = b.rijVan; r <= b.rijTot; r++) {
      for (let k = b.kolomVan; k <= b.kolomTot; k++) posities.add(`${r}_${k}`);
    }
  }
  return posities;
}

export type BaanschetsTotalen = Record<BaanschetsCategorie, number> & {
  totaal: number;
  totaalSkimatten: number;
};

function legeTotalen(): BaanschetsTotalen {
  const basis = Object.fromEntries(BAANSCHETS_CATEGORIEEN.map((k) => [k, 0])) as Record<
    BaanschetsCategorie,
    number
  >;
  return { ...basis, totaal: 0, totaalSkimatten: 0 };
}

/** Telt cellen per categorie. Optioneel beperkt tot een deelverzameling posities (sectie). */
export function telPerCategorie(
  cellen: { rij: number; kolom: number; categorie: BaanschetsCategorie }[],
  posities?: Set<string>
): BaanschetsTotalen {
  const totalen = legeTotalen();
  for (const cel of cellen) {
    if (posities && !posities.has(`${cel.rij}_${cel.kolom}`)) continue;
    totalen[cel.categorie]++;
    totalen.totaal++;
  }
  for (const key of BAANSCHETS_SKI_KEYS) totalen.totaalSkimatten += totalen[key];
  return totalen;
}

export function oppervlaktePerMat(instellingen: { breedteM: number; hoogteM: number }): number {
  return instellingen.breedteM * instellingen.hoogteM;
}

/** m² per categorie, afgeleid van de telling — nooit los opgeslagen. */
export function m2PerCategorie(
  totalen: BaanschetsTotalen,
  oppervlaktePerMatM2: number
): Record<BaanschetsCategorie, number> & { totaal: number; totaalSkimatten: number } {
  const resultaat: Record<string, number> = {};
  for (const key of BAANSCHETS_CATEGORIEEN) resultaat[key] = totalen[key] * oppervlaktePerMatM2;
  resultaat.totaal = totalen.totaal * oppervlaktePerMatM2;
  resultaat.totaalSkimatten = totalen.totaalSkimatten * oppervlaktePerMatM2;
  return resultaat as Record<BaanschetsCategorie, number> & {
    totaal: number;
    totaalSkimatten: number;
  };
}

/** Matten met een leeftijd die afwijkt van de ingestelde basisleeftijd. */
export function cellenMetAfwijkendeLeeftijd<T extends { leeftijd: number | null }>(
  cellen: T[],
  basisleeftijdSeizoenen: number
): T[] {
  return cellen.filter((c) => (c.leeftijd ?? basisleeftijdSeizoenen) !== basisleeftijdSeizoenen);
}

export function effectieveLeeftijd(
  cel: { leeftijd: number | null },
  basisleeftijdSeizoenen: number
): number {
  return cel.leeftijd ?? basisleeftijdSeizoenen;
}

export { BAANSCHETS_LEGENDA, BAANSCHETS_SKI_KEYS };

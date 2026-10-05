import * as XLSX from "xlsx";

import { formatDatumCel, formatTijdCel } from "@/lib/excel";
import { BAANSCHETS_LEGENDA, type BaanschetsTotalen } from "@/lib/baanschets";
import { BAANSCHETS_CATEGORIEEN, type BaanschetsCategorie } from "@/db/schema";

/**
 * Exporteert dezelfde gegevens als het oude baanschets.xlsx (legenda, secties,
 * rooster, logs), maar als gewone tabellen in plaats van een gekleurd
 * Excel-rooster. De hier geïnstalleerde `xlsx`-package (community-editie)
 * schrijft geen celstijlen — geverifieerd: een testbestand met een
 * achtergrondkleur kwam na schrijven/lezen zonder kleur terug — dus een
 * kleurreplica van het origineel is met deze dependency niet haalbaar zonder
 * een zwaardere stylingbibliotheek toe te voegen. Eén rij per mat (met de
 * categorie als tekst, net als de legenda-kolom hiernaast) is met zuivere
 * data bovendien net zo bruikbaar om in te lezen of te filteren.
 */

export type BaanschetsExportSectie = {
  nr: number;
  omschrijving: string;
  celbereik: string;
  totalen: BaanschetsTotalen;
  totaalM2: number;
};

export type BaanschetsExportCel = {
  rij: number;
  kolom: number;
  categorie: BaanschetsCategorie;
  leeftijdEffectief: number;
  opmerking: string;
  gemarkeerd: boolean;
};

export type BaanschetsExportLog = {
  seizoen: string;
  a: string;
  b: string;
  toelichting: string;
  medewerkerNaam: string;
  tijdstip: Date;
};

export function buildBaanschetsWorkbook(input: {
  totalen: BaanschetsTotalen;
  m2: Record<BaanschetsCategorie, number> & { totaal: number; totaalSkimatten: number };
  breedteM: number;
  hoogteM: number;
  basisleeftijdSeizoenen: number;
  secties: BaanschetsExportSectie[];
  cellen: BaanschetsExportCel[];
  rotaties: BaanschetsExportLog[];
  nieuweMatten: (BaanschetsExportLog & { aantal: number; leeftijdBijOpname: number })[];
}): Buffer {
  const wb = XLSX.utils.book_new();

  // -- Legenda + instellingen --------------------------------------------
  const legendaRijen = BAANSCHETS_CATEGORIEEN.map((key) => [
    key,
    BAANSCHETS_LEGENDA[key].label,
    `#${BAANSCHETS_LEGENDA[key].kleur.replace("#", "")}`,
    input.totalen[key],
    Number(input.m2[key].toFixed(2)),
  ]);
  const wsLegenda = XLSX.utils.aoa_to_sheet([
    ["Sleutel", "Label", "Kleur", "Aantal", "m²"],
    ...legendaRijen,
    [],
    ["Totaal skimatten", "", "", input.totalen.totaalSkimatten, Number(input.m2.totaalSkimatten.toFixed(2))],
    ["Totaal alle matten", "", "", input.totalen.totaal, Number(input.m2.totaal.toFixed(2))],
    [],
    ["Matafmeting breedte (m)", input.breedteM],
    ["Matafmeting hoogte (m)", input.hoogteM],
    ["Basisleeftijd (seizoenen)", input.basisleeftijdSeizoenen],
  ]);
  wsLegenda["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsLegenda, "Legenda");

  // -- Secties -------------------------------------------------------------
  const korteLabels = BAANSCHETS_CATEGORIEEN.map((k) => BAANSCHETS_LEGENDA[k].label);
  const sectieRijen = input.secties.map((s) => [
    s.nr,
    s.omschrijving,
    s.celbereik,
    ...BAANSCHETS_CATEGORIEEN.map((k) => s.totalen[k]),
    s.totalen.totaal,
    Number(s.totaalM2.toFixed(2)),
  ]);
  const wsSecties = XLSX.utils.aoa_to_sheet([
    ["Nr.", "Omschrijving", "Celbereik(en)", ...korteLabels, "Totaal", "m²"],
    ...sectieRijen,
  ]);
  wsSecties["!cols"] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 40 },
    ...korteLabels.map(() => ({ wch: 11 })),
    { wch: 9 },
    { wch: 9 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSecties, "Secties");

  // -- Rooster: één rij per mat, geen lege cellen ---------------------------
  const roosterRijen = input.cellen.map((c) => [
    c.rij,
    c.kolom,
    c.categorie,
    BAANSCHETS_LEGENDA[c.categorie].label,
    c.leeftijdEffectief,
    c.gemarkeerd ? "Ja" : "Nee",
    c.opmerking,
  ]);
  const wsRooster = XLSX.utils.aoa_to_sheet([
    ["Rij", "Kolom", "Categorie", "Label", "Leeftijd", "Fysiek geroteerd", "Opmerking"],
    ...roosterRijen,
  ]);
  wsRooster["!cols"] = [
    { wch: 6 },
    { wch: 7 },
    { wch: 12 },
    { wch: 16 },
    { wch: 9 },
    { wch: 15 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRooster, "Rooster");

  // -- Rotatiegeschiedenis ---------------------------------------------------
  const rotatieRijen = input.rotaties.map((r) => [
    r.seizoen,
    r.a,
    r.b,
    r.toelichting,
    r.medewerkerNaam,
    formatDatumCel(r.tijdstip),
    formatTijdCel(r.tijdstip),
  ]);
  const wsRotaties = XLSX.utils.aoa_to_sheet([
    ["Seizoen", "Van sectie", "Naar sectie", "Toelichting", "Vastgelegd door", "Datum", "Tijd"],
    ...rotatieRijen,
  ]);
  wsRotaties["!cols"] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 50 },
    { wch: 18 },
    { wch: 12 },
    { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRotaties, "Rotatiegeschiedenis");

  // -- Nieuwe matten opname ---------------------------------------------------
  const nieuweMattenRijen = input.nieuweMatten.map((n) => [
    n.seizoen,
    n.aantal,
    n.leeftijdBijOpname,
    n.a,
    n.toelichting,
    n.medewerkerNaam,
    formatDatumCel(n.tijdstip),
    formatTijdCel(n.tijdstip),
  ]);
  const totaalOpVoorraad = input.nieuweMatten.reduce((som, n) => som + n.aantal, 0);
  const wsNieuweMatten = XLSX.utils.aoa_to_sheet([
    ["Seizoen", "Aantal", "Leeftijd bij opname", "Vanuit sectie", "Toelichting", "Vastgelegd door", "Datum", "Tijd"],
    ...nieuweMattenRijen,
    [],
    ["Totaal op voorraad", totaalOpVoorraad],
  ]);
  wsNieuweMatten["!cols"] = [
    { wch: 10 },
    { wch: 8 },
    { wch: 16 },
    { wch: 14 },
    { wch: 50 },
    { wch: 18 },
    { wch: 12 },
    { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, wsNieuweMatten, "Nieuwe matten");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

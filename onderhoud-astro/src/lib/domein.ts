import type { Rol, Status, VeldType } from "../db/schema";

export const STATUS_LABELS: Record<Status, string> = {
  IN_GEBRUIK: "In gebruik",
  IN_REPARATIE: "In reparatie",
  BUITEN_GEBRUIK: "Buiten gebruik",
  TER_GOEDKEURING: "Ter goedkeuring",
};

/** Statussen die een medewerker zelf mag kiezen bij een registratie. */
export const STATUS_KEUZES: Status[] = ["IN_GEBRUIK", "IN_REPARATIE", "BUITEN_GEBRUIK"];

export const STATUS_VOLGORDE: Status[] = [
  "IN_GEBRUIK",
  "IN_REPARATIE",
  "BUITEN_GEBRUIK",
  "TER_GOEDKEURING",
];

/** Status is een globale toestand: deze kleuren zijn in elk onderdeel gelijk. */
export const STATUS_STIJL: Record<Status, string> = {
  IN_GEBRUIK: "bg-green-tint text-green-text",
  IN_REPARATIE: "bg-amber-tint text-amber-text",
  BUITEN_GEBRUIK: "bg-red-tint text-red-text",
  TER_GOEDKEURING: "bg-keuring-tint text-keuring-text",
};

export const ROL_LABELS: Record<Rol, string> = {
  BEHEERDER: "Beheerder",
  MEDEWERKER: "Medewerker",
  STAGIAIR: "Stagiair",
};

export const VELDTYPE_LABELS: Record<VeldType, string> = {
  TEKST: "Tekst",
  GETAL: "Getal",
  BEREIK: "Bereik",
  DATUM: "Datum",
  KEUZE: "Keuze",
};

/**
 * Aantal maanden zonder énige onderhoudsregistratie waarna materiaal in de
 * "aandacht nodig"-lijst verschijnt. Wordt berekend, nooit hardgecodeerd.
 */
export const AANDACHT_NODIG_MAANDEN = 9;

export function dagenSinds(datum: Date): number {
  return Math.floor((Date.now() - datum.getTime()) / 86_400_000);
}

export function heeftAandachtNodig(laatsteOnderhoud: Date | null, inGebruikSinds: Date): boolean {
  return dagenSinds(laatsteOnderhoud ?? inGebruikSinds) > AANDACHT_NODIG_MAANDEN * 30;
}

export function formatDatum(d: Date): string {
  return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatTijd(d: Date): string {
  return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

/** "Vandaag · 13-09-2026" / "Gisteren · 12-09-2026" / "11-09-2026" */
export function dagKop(d: Date): string {
  const datum = formatDatum(d);
  const vandaag = new Date();
  const gisteren = new Date();
  gisteren.setDate(gisteren.getDate() - 1);

  const zelfdeDag = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (zelfdeDag(d, vandaag)) return `Vandaag · ${datum}`;
  if (zelfdeDag(d, gisteren)) return `Gisteren · ${datum}`;
  return datum;
}

/** 1248 → "1.248" */
export function formatAantal(n: number): string {
  return n.toLocaleString("nl-NL");
}

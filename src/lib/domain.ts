import type { MaterialStatus, Role } from "@prisma/client";

export const STATUS_LABELS: Record<MaterialStatus, string> = {
  IN_GEBRUIK: "In gebruik",
  IN_REPARATIE: "In reparatie",
  BUITEN_GEBRUIK: "Buiten gebruik / afgekeurd",
};

export const STATUS_ORDER: MaterialStatus[] = [
  "IN_GEBRUIK",
  "IN_REPARATIE",
  "BUITEN_GEBRUIK",
];

export const ROLE_LABELS: Record<Role, string> = {
  INSTRUCTEUR: "Instructeur",
  DUTY_MANAGER: "Duty manager",
};

/**
 * Aantal maanden zonder onderhoudsregistratie waarna materiaal in de
 * "aandacht nodig"-lijst verschijnt. Categorie-onafhankelijk: elke
 * geregistreerde onderhoudsactie (niet één specifieke "grote beurt") telt
 * als onderhoudsmoment, zodat dit ook werkt voor categorieën met heel
 * andere onderhoudsacties.
 */
export const AANDACHT_NODIG_MAANDEN = 9;

export function dagenSinds(datum: Date): number {
  return Math.floor((Date.now() - datum.getTime()) / 86_400_000);
}

export function heeftAandachtNodig(laatsteOnderhoud: Date | null, aangemaakt: Date): boolean {
  const referentie = laatsteOnderhoud ?? aangemaakt;
  return dagenSinds(referentie) > AANDACHT_NODIG_MAANDEN * 30;
}

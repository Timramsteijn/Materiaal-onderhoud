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

/** De onderhoudsactie die telt als "algehele onderhoudsbeurt" voor de aandacht-nodig-lijst. */
export const GROTE_BEURT_TREFWOORD = "algehele onderhoudsbeurt";

export function isGroteBeurt(actie: string): boolean {
  return actie.toLowerCase().includes(GROTE_BEURT_TREFWOORD);
}

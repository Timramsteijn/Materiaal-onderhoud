import type { Role } from "@prisma/client";

export function isDutyManager(role: Role): boolean {
  return role === "DUTY_MANAGER";
}

/** Alleen duty managers mogen materiaal definitief verwijderen. */
export function canDeleteMaterial(role: Role): boolean {
  return isDutyManager(role);
}

/** Alleen duty managers mogen materiaal afkeuren ("Buiten gebruik / afgekeurd"). */
export function canSetOutOfService(role: Role): boolean {
  return isDutyManager(role);
}

/** Alleen duty managers beheren categorieen en hun onderhoudsacties. */
export function canManageCategories(role: Role): boolean {
  return isDutyManager(role);
}

/** Alleen duty managers beheren medewerkeraccounts. */
export function canManageUsers(role: Role): boolean {
  return isDutyManager(role);
}

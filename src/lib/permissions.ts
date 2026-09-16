import type { Rol } from "@prisma/client";

export function isBeheerder(rol: Rol): boolean {
  return rol === "BEHEERDER";
}

/** Registreren mag iedereen. */
export function magRegistreren(): boolean {
  return true;
}

/** Verwijderen, importeren, goedkeuren en medewerkerbeheer: alleen beheerders. */
export function magVerwijderen(rol: Rol): boolean {
  return isBeheerder(rol);
}

export function magImporteren(rol: Rol): boolean {
  return isBeheerder(rol);
}

/**
 * Een afkeuring definitief doorvoeren mag alleen een beheerder; een medewerker
 * kan afkeuren wél aanvragen (die zet het materiaal op "Ter goedkeuring").
 */
export function magAfkeuringGoedkeuren(rol: Rol): boolean {
  return isBeheerder(rol);
}

export function magCategorieenBeheren(rol: Rol): boolean {
  return isBeheerder(rol);
}

export function magMedewerkersBeheren(rol: Rol): boolean {
  return isBeheerder(rol);
}

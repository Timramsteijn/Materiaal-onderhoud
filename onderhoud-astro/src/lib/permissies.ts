import type { Rol } from "../db/schema";

export function isBeheerder(rol: Rol | undefined | null): boolean {
  return rol === "BEHEERDER";
}

/** Registreren mag iedereen die is ingelogd. */
export function magRegistreren(): boolean {
  return true;
}

/** Verwijderen, importeren, goedkeuren en medewerkerbeheer: alleen beheerders. */
export const magVerwijderen = isBeheerder;
export const magImporteren = isBeheerder;

/**
 * Een afkeuring definitief doorvoeren mag alleen een beheerder; een medewerker
 * kan afkeuren wél aanvragen (die zet het materiaal op "Ter goedkeuring").
 */
export const magAfkeuringGoedkeuren = isBeheerder;
export const magCategorieenBeheren = isBeheerder;
export const magMedewerkersBeheren = isBeheerder;

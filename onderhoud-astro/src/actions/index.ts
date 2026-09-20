import { inloggen } from "./auth";
import {
  bewerkMateriaal,
  maakMateriaal,
  verwijderMateriaal,
  zoekMateriaalId,
} from "./materiaal";
import { keurAfkeuringGoed, registreerOnderhoud, wijsAfkeuringAf } from "./registratie";
import { laatVerzoekVervallen, meldOnderhoudNodig } from "./verzoek";
import {
  archiveerActie,
  archiveerCategorie,
  archiveerVeld,
  voegActieToe,
  voegCategorieToe,
  voegMedewerkerToe,
  verwijderMedewerker,
  voegVeldToe,
  zetMedewerkerActief,
} from "./beheer";

/**
 * Alle mutaties lopen via Astro Actions: één plek waar invoer wordt gevalideerd
 * en waar de rolcontrole gebeurt. Formulieren werken zonder JavaScript.
 *
 * Uitloggen is bewust géén action maar een POST-endpoint (src/pages/uitloggen.ts),
 * omdat dat meteen naar het inlogscherm moet doorsturen.
 */
export const server = {
  inloggen,
  zoekMateriaalId,
  maakMateriaal,
  bewerkMateriaal,
  verwijderMateriaal,
  registreerOnderhoud,
  meldOnderhoudNodig,
  laatVerzoekVervallen,
  keurAfkeuringGoed,
  wijsAfkeuringAf,
  voegCategorieToe,
  archiveerCategorie,
  voegActieToe,
  archiveerActie,
  voegVeldToe,
  archiveerVeld,
  voegMedewerkerToe,
  zetMedewerkerActief,
  verwijderMedewerker,
};

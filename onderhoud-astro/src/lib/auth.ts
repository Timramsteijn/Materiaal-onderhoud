import { eq } from "drizzle-orm";
import type { AstroSession } from "astro";

import { db } from "./context";
import { medewerkers } from "../db/schema";
import { controleerWachtwoord } from "./wachtwoord";

export type IngelogdeMedewerker = App.SessionData["medewerker"];

/**
 * Controleert de inloggegevens en zet de medewerker in de sessie (KV).
 * Geeft `null` terug bij een onbekende gebruiker, een verkeerd wachtwoord of
 * een gedeactiveerd account — de reden verschilt bewust niet, zodat het
 * inlogscherm niets over bestaande accounts prijsgeeft.
 */
export async function inloggen(
  session: AstroSession | undefined,
  gebruikersnaam: string,
  wachtwoord: string
): Promise<IngelogdeMedewerker | null> {
  const rij = await db().query.medewerkers.findFirst({
    where: eq(medewerkers.gebruikersnaam, gebruikersnaam.trim().toLowerCase()),
  });

  // Ook zonder treffer het wachtwoord verwerken zou netter zijn tegen timing,
  // maar PBKDF2 op een dummy-hash kost hier onnodig CPU-tijd op Workers.
  if (!rij || !rij.actief) return null;
  if (!(await controleerWachtwoord(wachtwoord, rij.wachtwoordHash))) return null;

  const medewerker: IngelogdeMedewerker = {
    id: rij.id,
    naam: rij.naam,
    rol: rij.rol,
    functie: rij.functie,
  };
  // Nieuw sessie-id bij het inloggen: voorkomt session fixation.
  await session?.regenerate();
  session?.set("medewerker", medewerker);
  return medewerker;
}

export function uitloggen(session: AstroSession | undefined): void {
  session?.destroy();
}

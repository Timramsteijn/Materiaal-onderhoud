import { ActionError } from "astro:actions";
import type { ActionAPIContext } from "astro:actions";

import { isBeheerder } from "./permissies";

/**
 * Elke mutatie begint hiermee. De sessie wordt hier zelf gelezen (en niet uit
 * `locals`), zodat de rolcontrole niet afhangt van de volgorde waarin Astro de
 * middleware en de action uitvoert.
 */
export async function vereisMedewerker(context: ActionAPIContext) {
  const medewerker = await context.session?.get("medewerker");
  if (!medewerker) {
    throw new ActionError({ code: "UNAUTHORIZED", message: "Niet ingelogd." });
  }
  return medewerker;
}

export async function vereisBeheerder(context: ActionAPIContext) {
  const medewerker = await vereisMedewerker(context);
  if (!isBeheerder(medewerker.rol)) {
    throw new ActionError({ code: "FORBIDDEN", message: "Alleen beheerders mogen dit doen." });
  }
  return medewerker;
}

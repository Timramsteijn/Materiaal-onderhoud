import "server-only";

import { auth } from "@/lib/auth";
import { isBeheerder } from "@/lib/permissions";

export class ActionError extends Error {}

export async function requireMedewerker() {
  const session = await auth();
  if (!session?.user) throw new ActionError("Niet ingelogd.");
  return session.user;
}

export async function requireBeheerder() {
  const medewerker = await requireMedewerker();
  if (!isBeheerder(medewerker.rol)) {
    throw new ActionError("Alleen beheerders mogen dit doen.");
  }
  return medewerker;
}

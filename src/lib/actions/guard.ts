import "server-only";

import { auth } from "@/lib/auth";
import { isDutyManager } from "@/lib/permissions";

export class ActionError extends Error {}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new ActionError("Niet ingelogd.");
  return session.user;
}

export async function requireDutyManager() {
  const user = await requireUser();
  if (!isDutyManager(user.role)) {
    throw new ActionError("Alleen duty managers mogen dit doen.");
  }
  return user;
}

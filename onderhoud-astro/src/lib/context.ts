import { env } from "cloudflare:workers";
import { maakDb, type Db } from "../db";

export type Medewerker = App.SessionData["medewerker"];

/**
 * De app draait (ook lokaal) in workerd, dus de bindings komen rechtstreeks uit
 * de Workers-omgeving in plaats van via locals doorgegeven te worden.
 */
export function db(): Db {
  return maakDb((env as unknown as Env).DB);
}

export { isBeheerder } from "./permissies";

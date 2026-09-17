import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * De D1-binding komt uit de Workers-omgeving. Binnen Astro Actions en pagina's
 * halen we hem uit `locals.runtime.env`; in scripts (seed) geven we hem door.
 */
export function maakDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Db = ReturnType<typeof maakDb>;
export { schema };

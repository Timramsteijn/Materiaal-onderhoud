/**
 * Database-id's. Geen auto-increment: een willekeurig id lekt niets over
 * aantallen en laat de offline wachtrij z'n eigen sleutels meesturen.
 */
export function nieuwId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

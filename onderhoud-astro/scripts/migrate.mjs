/**
 * Voert de migraties uit zonder bevestigingsvraag.
 *
 *   node scripts/migrate.mjs            (lokale D1)
 *   node scripts/migrate.mjs --remote   (D1 in Cloudflare)
 *
 * Wrangler vraagt anders "continue?"; per ongeluk "nee" antwoorden laat je met
 * een lege database achter en dat is bij het opzetten lastig te herkennen: de
 * app start wel, maar elke pagina valt om. Met CI=1 neemt wrangler zelf "ja"
 * aan. Dat gebeurt hier in plaats van in package.json, omdat `CI=1 wrangler …`
 * op Windows niet werkt.
 */

import { wrangler } from "./wrangler.mjs";

const doel = process.argv.slice(2).includes("--remote") ? "--remote" : "--local";

wrangler(["d1", "migrations", "apply", "onderhoud", doel], {
  env: { ...process.env, CI: "1" },
});

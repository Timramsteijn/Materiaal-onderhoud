/**
 * Voert de migraties uit zonder bevestigingsvraag.
 *
 *   node scripts/migrate.mjs            (lokale D1)
 *   node scripts/migrate.mjs --remote   (D1 in Cloudflare)
 *
 * Wrangler vraagt anders "continue?"; per ongeluk "nee" antwoorden laat je met
 * een lege database achter en dat is bij het opzetten lastig te zien. Met CI=1
 * neemt wrangler zelf "ja" aan. Dat gebeurt hier in plaats van in package.json,
 * omdat `CI=1 wrangler …` op Windows niet werkt.
 */

import { execFileSync } from "node:child_process";

const doel = process.argv.slice(2).includes("--remote") ? "--remote" : "--local";

// Op Windows is npx een .cmd-shim; zonder de extensie vindt execFileSync hem niet.
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

execFileSync(npx, ["wrangler", "d1", "migrations", "apply", "onderhoud", doel], {
  stdio: "inherit",
  env: { ...process.env, CI: "1" },
});

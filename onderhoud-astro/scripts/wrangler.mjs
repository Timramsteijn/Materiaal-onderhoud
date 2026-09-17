import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);

/**
 * Roept wrangler aan met dezelfde Node die dit script draait.
 *
 * Niet via `npx`: dat is op Windows een .cmd-bestand, en Node weigert die sinds
 * een beveiligingsupdate te starten (EINVAL). Het startbestand zoeken we op via
 * package.json, want het `exports`-veld van wrangler laat geen rechtstreeks pad
 * naar bin/ toe.
 */
function startbestand() {
  const pakket = require.resolve("wrangler/package.json");
  const { bin } = JSON.parse(readFileSync(pakket, "utf8"));
  const pad = typeof bin === "string" ? bin : bin.wrangler;
  return join(dirname(pakket), pad);
}

export function wrangler(argumenten, opties = {}) {
  execFileSync(process.execPath, [startbestand(), ...argumenten], {
    stdio: "inherit",
    ...opties,
  });
}

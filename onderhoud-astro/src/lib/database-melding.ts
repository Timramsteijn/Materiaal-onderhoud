/**
 * Een niet-ingerichte database kwam eerder naar buiten als een kale 500. Dat is
 * bij het opzetten van een werkplek precies het verkeerde signaal: er is niets
 * stuk, er moet alleen nog gemigreerd en geseed worden. Vandaar een eigen
 * pagina die dat gewoon zegt.
 */

/**
 * Drizzle verpakt de fout ("Failed query: select …"); de eigenlijke melding van
 * SQLite zit in de oorzaak eronder. Daarom de hele keten aflopen.
 */
export function isDatabaseNietIngericht(fout: unknown, diepte = 0): boolean {
  if (!fout || diepte > 5) return false;

  const melding = fout instanceof Error ? fout.message : String(fout);
  if (/no such table/i.test(melding)) return true;

  return fout instanceof Error ? isDatabaseNietIngericht(fout.cause, diepte + 1) : false;
}

/** Losse HTML, zonder layout: die haalt zelf ook weer dingen uit de database. */
export function databaseMeldingAntwoord(): Response {
  const html = `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Database nog niet ingericht — Materiaalonderhoud</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0; min-height: 100vh; display: flex; align-items: center;
        justify-content: center; padding: 24px; background: #e7e4db; color: #15212b;
        font-family: system-ui, sans-serif; line-height: 1.5;
      }
      .kaart {
        max-width: 640px; background: #f4f2ec; border: 1px solid #d8d5cc;
        border-radius: 10px; padding: 28px; box-shadow: 0 3px 10px rgba(21, 33, 43, 0.06);
      }
      .kicker {
        margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
        text-transform: uppercase; color: #a03c14;
      }
      h1 { margin: 8px 0 0; font-size: 22px; line-height: 1.2; }
      p { margin: 12px 0 0; font-size: 14px; color: #3c4a52; }
      pre {
        margin: 16px 0 0; padding: 14px 16px; overflow-x: auto; border-radius: 8px;
        background: #15212b; color: #f4f2ec; font-size: 13px; line-height: 1.7;
      }
      code { font-family: ui-monospace, "Cascadia Code", Consolas, monospace; }
      .klein { font-size: 12.5px; color: #535c61; }
    </style>
  </head>
  <body>
    <main class="kaart">
      <p class="kicker">Nog even dit</p>
      <h1>De database is nog niet ingericht</h1>
      <p>
        De app draait, maar de tabellen bestaan nog niet. Voer dit uit in de map
        <code>onderhoud-astro</code> en ververs daarna deze pagina:
      </p>
      <pre><code>npm run db:migrate
set SEED_ADMIN_WACHTWOORD=kies-een-wachtwoord
npm run seed</code></pre>
      <p class="klein">
        Op macOS of Linux gebruik je <code>SEED_ADMIN_WACHTWOORD=… npm run seed</code> op één regel.
        Het migreren moet eindigen met een ✅ achter <code>0000_eerste_opzet.sql</code>, het seeden
        met <code>Seed klaar.</code>
      </p>
    </main>
  </body>
</html>`;

  return new Response(html, {
    status: 503,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

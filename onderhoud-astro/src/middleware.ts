import { defineMiddleware } from "astro:middleware";
import { eq } from "drizzle-orm";

import { db } from "@/lib/context";
import { medewerkers } from "@/db/schema";
import { databaseMeldingAntwoord, isDatabaseNietIngericht } from "@/lib/database-melding";

/**
 * Alles zit achter de login. Assets serveert Cloudflare zelf (die komen niet
 * langs de middleware), dus hier hoeft alleen het inlogscherm open te staan.
 */
const OPEN_PADEN = ["/inloggen", "/manifest.json", "/sw.js"];

function isOpen(pad: string): boolean {
  return OPEN_PADEN.some((open) => pad === open || pad.startsWith(`${open}/`));
}

/**
 * Alleen tijdens ontwikkelen: zet `ONTWIKKEL_INLOG=t.verhoeven` in een
 * .env-bestand en je slaat het inlogscherm over. `import.meta.env.DEV` is bij
 * het bouwen een constante, dus dit blok verdwijnt volledig uit een
 * productiebuild — het kan nooit per ongeluk meeliften naar Cloudflare.
 */
async function ontwikkelMedewerker() {
  const gebruikersnaam = import.meta.env.ONTWIKKEL_INLOG;
  if (!import.meta.env.DEV || !gebruikersnaam) return null;

  const rij = await db().query.medewerkers.findFirst({
    where: eq(medewerkers.gebruikersnaam, String(gebruikersnaam).trim().toLowerCase()),
  });
  if (!rij) return null;

  return { id: rij.id, naam: rij.naam, rol: rij.rol, functie: rij.functie };
}

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    return await afhandelen(context, next);
  } catch (fout) {
    // Een lege database is geen storing maar een openstaande installatiestap.
    if (isDatabaseNietIngericht(fout)) return databaseMeldingAntwoord();
    throw fout;
  }
});

type Context = Parameters<Parameters<typeof defineMiddleware>[0]>[0];
type Volgende = Parameters<Parameters<typeof defineMiddleware>[0]>[1];

async function afhandelen(context: Context, next: Volgende) {
  let medewerker = (await context.session?.get("medewerker")) ?? null;

  if (!medewerker) {
    const ontwikkel = await ontwikkelMedewerker();
    if (ontwikkel) {
      // In de sessie zetten, want de actions lezen daar hun medewerker uit.
      context.session?.set("medewerker", ontwikkel);
      medewerker = ontwikkel;
    }
  }

  context.locals.medewerker = medewerker;

  const pad = context.url.pathname;

  if (!medewerker && !isOpen(pad)) {
    // Waar de bezoeker heen wilde onthouden, zodat inloggen daar uitkomt.
    const verder = pad === "/" ? "" : `?verder=${encodeURIComponent(pad + context.url.search)}`;
    return context.redirect(`/inloggen${verder}`);
  }

  // Alleen bij een GET: een POST op /inloggen is de action zelf, die mag door.
  if (medewerker && pad === "/inloggen" && context.request.method === "GET") {
    return context.redirect("/onderdeel");
  }

  return next();
}

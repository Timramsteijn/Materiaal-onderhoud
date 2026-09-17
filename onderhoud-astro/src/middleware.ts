import { defineMiddleware } from "astro:middleware";

/**
 * Alles zit achter de login. Assets serveert Cloudflare zelf (die komen niet
 * langs de middleware), dus hier hoeft alleen het inlogscherm open te staan.
 */
const OPEN_PADEN = ["/inloggen", "/manifest.json", "/sw.js"];

function isOpen(pad: string): boolean {
  return OPEN_PADEN.some((open) => pad === open || pad.startsWith(`${open}/`));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const medewerker = (await context.session?.get("medewerker")) ?? null;
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
});

// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // De hele app zit achter een login en leest live uit D1, dus alles wordt
  // per verzoek gerenderd; alleen losse assets komen van de CDN.
  output: "server",
  adapter: cloudflare(),
  integrations: [react()],
  // De driver vult de Cloudflare-adapter zelf in (KV-binding SESSION); hier
  // staat alleen hoe het cookie zich gedraagt.
  session: {
    cookie: {
      name: "onderhoud-sessie",
      sameSite: "lax",
      httpOnly: true,
      // Lokaal draait de dev-server op http; daar zou een secure-cookie
      // nooit teruggestuurd worden.
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
    // Een werkdag ingelogd blijven; daarna opnieuw inloggen.
    ttl: 60 * 60 * 12,
  },
  vite: {
    plugins: [tailwindcss()],
    css: {
      // Tailwind loopt via de Vite-plugin hierboven, dus PostCSS heeft niets te
      // doen. Een lege config zet ook de zoektocht omhoog stil: zonder dit pakt
      // Vite de postcss.config.mjs van de Next.js-app in de map erboven op.
      postcss: {},
    },
  },
});

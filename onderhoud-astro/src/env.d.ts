/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface ImportMetaEnv {
  /** Ontwikkelhulp: sla het inlogscherm over als deze gebruikersnaam bestaat. */
  readonly ONTWIKKEL_INLOG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Env {
  DB: D1Database;
  SESSION: KVNamespace;
}

declare namespace App {
  /** Vorm van de sessie-inhoud: Astro.session.get("medewerker") */
  interface SessionData {
    medewerker: {
      id: string;
      naam: string;
      rol: "BEHEERDER" | "MEDEWERKER" | "STAGIAIR";
      functie: string;
    };
  }

  interface Locals {
    /** Door de middleware gezet; `null` op de publieke routes. */
    medewerker: SessionData["medewerker"] | null;
  }
}

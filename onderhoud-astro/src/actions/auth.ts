import { defineAction } from "astro:actions";
import { z } from "astro/zod";

import { inloggen as inlogPoging } from "@/lib/auth";

export const inloggen = defineAction({
  accept: "form",
  input: z.object({
    gebruikersnaam: z.string().min(1, "Vul je gebruikersnaam in."),
    wachtwoord: z.string().min(1, "Vul je wachtwoord in."),
  }),
  handler: async ({ gebruikersnaam, wachtwoord }, context) => {
    const medewerker = await inlogPoging(context.session, gebruikersnaam, wachtwoord);
    // Bewust geen ActionError: het inlogscherm toont één neutrale melding.
    return medewerker
      ? { ok: true as const }
      : { ok: false as const, melding: "Onjuiste gebruikersnaam of wachtwoord." };
  },
});

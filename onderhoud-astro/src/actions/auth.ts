import { defineAction } from "astro:actions";
import { z } from "astro/zod";

import { inloggen as inlogPoging } from "@/lib/auth";
import { isDatabaseNietIngericht } from "@/lib/database-melding";

export const inloggen = defineAction({
  accept: "form",
  // Leeg toestaan en het zelf afhandelen: zo kan de melding benoemen wát er
  // ontbreekt, en kan de ingevulde gebruikersnaam terug het formulier in.
  input: z.object({
    gebruikersnaam: z.string().optional(),
    wachtwoord: z.string().optional(),
  }),
  handler: async ({ gebruikersnaam, wachtwoord }, context) => {
    const naam = (gebruikersnaam ?? "").trim();
    const geheim = wachtwoord ?? "";

    if (!naam || !geheim) {
      return {
        ok: false as const,
        gebruikersnaam: naam,
        melding: naam ? "Vul je wachtwoord in." : "Vul je gebruikersnaam in.",
      };
    }

    let medewerker;
    try {
      medewerker = await inlogPoging(context.session, naam, geheim);
    } catch (fout) {
      // Hier is de melding nuttiger dan een 500: er is niets stuk, de database
      // moet alleen nog gemigreerd en geseed worden.
      if (!isDatabaseNietIngericht(fout)) throw fout;
      return {
        ok: false as const,
        gebruikersnaam: naam,
        melding: "De database is nog niet ingericht. Draai `npm run db:migrate` en `npm run seed`.",
      };
    }
    // Bewust één neutrale melding: het inlogscherm verraadt niet of een
    // gebruikersnaam bestaat.
    return medewerker
      ? { ok: true as const }
      : {
          ok: false as const,
          gebruikersnaam: naam,
          melding: "Onjuiste gebruikersnaam of wachtwoord.",
        };
  },
});

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        gebruikersnaam: { label: "Gebruikersnaam", type: "text" },
        wachtwoord: { label: "Wachtwoord", type: "password" },
      },
      authorize: async (credentials) => {
        const gebruikersnaam = credentials?.gebruikersnaam;
        const wachtwoord = credentials?.wachtwoord;
        if (typeof gebruikersnaam !== "string" || typeof wachtwoord !== "string") {
          return null;
        }

        const medewerker = await prisma.medewerker.findUnique({
          where: { gebruikersnaam: gebruikersnaam.trim().toLowerCase() },
        });
        if (!medewerker || !medewerker.actief) return null;

        const ok = await bcrypt.compare(wachtwoord, medewerker.wachtwoordHash);
        if (!ok) return null;

        return {
          id: medewerker.id,
          naam: medewerker.naam,
          rol: medewerker.rol,
          functie: medewerker.functie,
        };
      },
    }),
  ],
});

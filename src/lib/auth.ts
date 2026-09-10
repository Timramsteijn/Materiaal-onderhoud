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

        const user = await prisma.user.findUnique({
          where: { gebruikersnaam: gebruikersnaam.trim().toLowerCase() },
        });
        if (!user || !user.actief) return null;

        const ok = await bcrypt.compare(wachtwoord, user.wachtwoordHash);
        if (!ok) return null;

        return { id: user.id, naam: user.naam, role: user.role };
      },
    }),
  ],
});

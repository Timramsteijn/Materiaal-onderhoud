import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Rol } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      naam: string;
      rol: Rol;
      functie: string;
    };
  }
  interface User {
    id: string;
    naam: string;
    rol: Rol;
    functie: string;
  }
}

// `declare module "next-auth/jwt"` augmentation is onbetrouwbaar met deze
// next-auth beta + TS "bundler" moduleResolution (het onderliggende jwt.d.ts
// is een pure re-export van @auth/core/jwt). In plaats daarvan breiden we
// het JWT-type lokaal uit en casten we binnen de callbacks hieronder.
interface AppJWT extends JWT {
  id: string;
  naam: string;
  rol: Rol;
  functie: string;
}

/**
 * Edge-veilige basisconfiguratie (geen Prisma/bcrypt hier): wordt zowel door
 * de proxy (route-bescherming) als door de volledige auth-config met de
 * credentials-provider gebruikt, zodat beide dezelfde JWT/sessie-vorm delen.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/inloggen" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = request.nextUrl.pathname.startsWith("/inloggen");
      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      const appToken = token as AppJWT;
      if (user) {
        appToken.id = user.id;
        appToken.naam = user.naam;
        appToken.rol = user.rol;
        appToken.functie = user.functie;
      }
      return appToken;
    },
    session({ session, token }) {
      const appToken = token as AppJWT;
      session.user.id = appToken.id;
      session.user.naam = appToken.naam;
      session.user.rol = appToken.rol;
      session.user.functie = appToken.functie;
      return session;
    },
  },
};

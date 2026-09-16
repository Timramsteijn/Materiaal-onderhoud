import { auth } from "@/lib/auth";

export const proxy = auth;

export const config = {
  // Alles behalve statische assets, merkbestanden (het logo staat op het
  // inlogscherm), PWA-manifest/icons en de NextAuth-API-routes zelf.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|manifest.json|icons|brand|favicon.ico|sw.js).*)",
  ],
};

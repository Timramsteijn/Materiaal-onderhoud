import "server-only";
import { headers } from "next/headers";

/**
 * Absolute basis-URL van de draaiende app. Nodig voor de QR-codes: die bevatten
 * de volledige URL van het materiaalkaartje, zodat een scan met de gewone
 * telefooncamera ook buiten de app werkt.
 */
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

export async function materiaalUrl(slug: string, materiaalId: string): Promise<string> {
  const basis = await getBaseUrl();
  return `${basis}/${slug}/materiaal/${encodeURIComponent(materiaalId)}`;
}

import "server-only";
import { headers } from "next/headers";
import QRCode from "qrcode";

/**
 * Origin van de draaiende app, uit de request zelf. Nodig omdat de QR een
 * absolute URL moet bevatten: een scan met de gewone telefooncamera moet ook
 * buiten de app op het materiaalkaartje uitkomen.
 */
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** De absolute URL van het materiaalkaartje — precies wat er in de QR komt. */
export function materiaalUrl(origin: string, slug: string, materiaalId: string): string {
  return `${origin}/${encodeURIComponent(slug)}/materiaal/${encodeURIComponent(materiaalId)}`;
}

/**
 * QR als PNG data-URL: navy modules op een crème vlak. Donker-op-licht, want
 * een omgekeerde QR wordt lang niet door elke telefooncamera gelezen; het
 * donkere vlak uit het ontwerp zit eromheen (zie .qr in print.css). De marge
 * van twee modules houdt de verplichte stille zone binnen de code zelf.
 */
export async function qrDataUrl(url: string, breedte: number): Promise<string> {
  return QRCode.toDataURL(url, {
    margin: 2,
    width: breedte,
    errorCorrectionLevel: "M",
    color: { dark: "#15212b", light: "#f4f2ec" },
  });
}

/**
 * Een Materiaal-ID in de URL staat er zoals op de sticker ("SKI-0917"), maar
 * kan tekens bevatten die gecodeerd zijn. Kapotte codering mag geen 500 geven.
 */
export function decodeSegment(waarde: string): string {
  try {
    return decodeURIComponent(waarde);
  } catch {
    return waarde;
  }
}

/** `veldwaarden` is Json; hier als vlakke tekstmap, zonder lege waarden. */
export function veldwaardenVan(json: unknown): Record<string, string> {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  const uit: Record<string, string> = {};
  for (const [sleutel, waarde] of Object.entries(json as Record<string, unknown>)) {
    if (waarde === null || waarde === undefined || waarde === "") continue;
    uit[sleutel] = String(waarde);
  }
  return uit;
}

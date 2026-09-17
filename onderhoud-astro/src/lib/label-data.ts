import { qrSvg } from "./qr";

/** De absolute URL van het materiaalkaartje — precies wat er in de QR komt. */
export function labelUrl(origin: string, slug: string, materiaalId: string): string {
  return `${origin}/${encodeURIComponent(slug)}/materiaal/${encodeURIComponent(materiaalId)}`;
}

/**
 * QR voor op papier: navy modules op een crème vlak. Donker-op-licht, want een
 * omgekeerde QR wordt lang niet door elke telefooncamera gelezen; het donkere
 * vlak uit het ontwerp zit eromheen (zie .qr in print.css).
 */
export function labelQr(url: string): string {
  return qrSvg(url, { kleur: "#15212b" }).replace('fill="#ffffff"', 'fill="#f4f2ec"');
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

/** `veldwaarden` is JSON-tekst; hier als vlakke tekstmap, zonder lege waarden. */
export function veldwaardenVan(json: string | null | undefined): Record<string, string> {
  if (!json) return {};
  let ontleed: unknown;
  try {
    ontleed = JSON.parse(json);
  } catch {
    return {};
  }
  if (!ontleed || typeof ontleed !== "object" || Array.isArray(ontleed)) return {};

  const uit: Record<string, string> = {};
  for (const [sleutel, waarde] of Object.entries(ontleed as Record<string, unknown>)) {
    if (waarde === null || waarde === undefined || waarde === "") continue;
    uit[sleutel] = String(waarde);
  }
  return uit;
}

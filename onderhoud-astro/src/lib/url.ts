/**
 * Absolute basis-URL van de draaiende app, afgeleid uit het verzoek. Nodig
 * voor de QR-codes: die bevatten de volledige URL van het materiaalkaartje.
 */
export function basisUrl(url: URL): string {
  return url.origin;
}

export function materiaalUrl(url: URL, slug: string, materiaalId: string): string {
  return `${basisUrl(url)}/${slug}/materiaal/${encodeURIComponent(materiaalId)}`;
}

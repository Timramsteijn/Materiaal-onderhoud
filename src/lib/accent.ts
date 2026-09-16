import type { CSSProperties } from "react";

export type AccentTokens = {
  accent: string;
  accentPressed: string;
  accentTint: string;
};

function relatieveLuminantie(hex: string): number {
  const v = hex.replace("#", "");
  const kanalen = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * kanalen[0] + 0.7152 * kanalen[1] + 0.0722 * kanalen[2];
}

/**
 * Tekst op een accentvlak is crème, behalve op lichte accenten (zoals het
 * oranje van Mountainbike) waar navy het juiste contrast geeft. Afgeleid uit
 * de luminantie, zodat een nieuw onderdeel alleen een kleur hoeft te krijgen.
 */
export function accentOn(accent: string): string {
  return relatieveLuminantie(accent) > 0.35 ? "#15212b" : "#f4f2ec";
}

/**
 * Zet het accent van één onderdeel als CSS-variabelen. Componenten verwijzen
 * alleen naar var(--accent) c.s. — nooit een kleur hard in een component.
 */
export function accentStyle(onderdeel: AccentTokens): CSSProperties {
  return {
    "--accent": onderdeel.accent,
    "--accent-pressed": onderdeel.accentPressed,
    "--accent-tint": onderdeel.accentTint,
    "--accent-ink": onderdeel.accentPressed,
    "--accent-on": accentOn(onderdeel.accent),
  } as CSSProperties;
}

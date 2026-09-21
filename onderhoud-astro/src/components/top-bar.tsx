import type { ReactNode } from "react";
import { UitlogKnop } from "@/components/uitlog-knop";
import { Logo } from "@/components/logo";

/** Desktop-topbalk: 66px, crème, 1px onderrand. Inhoud verschilt per pagina. */
export function TopBar({
  titel,
  subregel,
  medewerkerNaam,
  functie,
  children,
}: {
  titel?: string;
  subregel?: string;
  medewerkerNaam: string;
  functie: string;
  /** Vrije inhoud links (zoekveld, knoppen) in plaats van of naast de titel. */
  children?: ReactNode;
}) {
  return (
    <div className="no-print hidden h-[66px] shrink-0 items-center justify-between gap-4 border-b border-border-light bg-creme px-6 desktop:flex">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {titel && (
          <div className="min-w-0">
            <p className="truncate text-[13px] font-extrabold uppercase tracking-[0.12em] text-ink">
              {titel}
            </p>
            {subregel && <p className="truncate text-[11.5px] text-text-muted">{subregel}</p>}
          </div>
        )}
        {children}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {/* Verstopt extraatje: een paar keer snel klikken opent een spelletje.
            Puur cosmetisch, dus gewone markup — geen React-state nodig; de
            klikteller zit in het vanilla scriptje van EasterEggSpel.astro. */}
        <button
          type="button"
          data-ov-logo-trigger
          aria-label="Outdoor Valley"
          className="motion flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-neutral-fill"
        >
          <Logo variant="merkteken" size={17} />
        </button>
        <div className="ml-2 text-right">
          <p className="text-[13px] font-semibold text-ink">{medewerkerNaam}</p>
          <p className="text-[11px] text-text-muted">{functie}</p>
        </div>
        <UitlogKnop variant="licht" />
      </div>
    </div>
  );
}

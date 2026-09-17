import type { ReactNode } from "react";
import { UitlogKnop } from "@/components/uitlog-knop";

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
      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p className="text-[13px] font-semibold text-ink">{medewerkerNaam}</p>
          <p className="text-[11px] text-text-muted">{functie}</p>
        </div>
        <UitlogKnop variant="licht" />
      </div>
    </div>
  );
}

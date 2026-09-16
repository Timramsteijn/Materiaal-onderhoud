import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

/** Mobiele chrome: navy header met het actieve onderdeel in de accentkleur. */
export function AppHeader({
  onderdeelNaam,
  medewerkerNaam,
}: {
  onderdeelNaam?: string;
  /** Getoond i.p.v. de onderdeelregel op schermen buiten een onderdeel. */
  medewerkerNaam?: string;
}) {
  return (
    <header className="no-print flex items-center justify-between gap-3 bg-navy px-[18px] py-3.5 desktop:hidden">
      <div className="min-w-0">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-creme">
          Materiaalonderhoud
        </p>
        {onderdeelNaam ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2">
            <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-accent">
              {onderdeelNaam}
            </span>
            <Link
              href="/onderdeel"
              prefetch={false}
              className="motion border-b border-border-dark text-[11px] text-text-on-dark hover:text-creme"
            >
              wissel van onderdeel
            </Link>
          </p>
        ) : medewerkerNaam ? (
          <p className="mt-0.5 text-[12px] text-text-on-dark">Ingelogd als {medewerkerNaam}</p>
        ) : null}
      </div>
      <LogoutButton variant="donker" />
    </header>
  );
}

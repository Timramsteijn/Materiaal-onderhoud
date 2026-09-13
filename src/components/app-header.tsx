import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export function AppHeader({
  department,
  userNaam,
}: {
  department?: { id: string; naam: string } | null;
  /** Getoond i.p.v. de onderdeelregel op schermen buiten een onderdeel (bv. onderdeel-kiezen). */
  userNaam?: string;
}) {
  return (
    <header className="no-print flex items-center justify-between bg-ink px-[18px] py-3.5 desktop:hidden">
      <div className="min-w-0">
        <p className="font-display text-[13px] font-extrabold uppercase italic tracking-[0.12em] text-white">
          Materiaalonderhoud
        </p>
        {department ? (
          <p className="mt-0.5 flex items-center gap-2">
            <span className="text-[12px] font-medium uppercase text-orange">{department.naam}</span>
            <Link
              href="/onderdeel"
              prefetch={false}
              className="border-b border-border-dark text-[11px] text-text-dark-secondary hover:text-white"
            >
              wissel van onderdeel
            </Link>
          </p>
        ) : userNaam ? (
          <p className="mt-0.5 text-[12px] text-text-dark-secondary">Ingelogd als {userNaam}</p>
        ) : null}
      </div>
      <LogoutButton variant="dark" />
    </header>
  );
}

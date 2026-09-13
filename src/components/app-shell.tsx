import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { SideNav } from "@/components/side-nav";

/**
 * Gedeelde responsieve app-chrome: onder ~900px header + vaste tabbalk
 * (mobiele vorm), vanaf ~900px zijnavigatie (desktopvorm). Beide weergaven
 * delen dezelfde navigatie-items (zie lib/nav-items) en tonen/verbergen
 * elkaar puur via CSS, zodat routing en scoping identiek blijven.
 *
 * De desktop-topbalk zelf hoort hier bewust niet bij: die inhoud (zoekveld,
 * paginatitel, acties) verschilt per pagina, dus elke pagina rendert zijn
 * eigen <TopBar> als eerste element van zijn content.
 */
export function AppShell({
  department,
  isDutyManager,
  children,
}: {
  department?: { id: string; naam: string } | null;
  isDutyManager: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col desktop:flex-row">
      <SideNav
        isDutyManager={isDutyManager}
        departmentId={department?.id}
        departmentNaam={department?.naam}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader department={department} />
        <main className="flex-1 pb-24 desktop:pb-0">{children}</main>
        <BottomNav isDutyManager={isDutyManager} departmentId={department?.id} />
      </div>
    </div>
  );
}

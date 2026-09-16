import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { SideNav } from "@/components/side-nav";

/**
 * Gedeelde responsieve chrome: onder ~900px navy header + vaste tabbalk,
 * vanaf ~900px navy zijnav. Beide weergaven delen dezelfde navigatie-items;
 * ze tonen en verbergen elkaar puur via CSS.
 *
 * De topbalk hoort hier bewust niet bij: die inhoud (titel, zoekveld, acties)
 * verschilt per pagina, dus elke pagina rendert zijn eigen <TopBar>.
 */
export function AppShell({
  slug,
  onderdeelNaam,
  isBeheerder,
  children,
}: {
  slug: string;
  onderdeelNaam: string;
  isBeheerder: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col desktop:flex-row">
      <SideNav slug={slug} onderdeelNaam={onderdeelNaam} isBeheerder={isBeheerder} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onderdeelNaam={onderdeelNaam} />
        {children}
        <BottomNav slug={slug} isBeheerder={isBeheerder} />
      </div>
    </div>
  );
}

import type { IconComponent } from "@/components/icons";
import { ScanLine, Package, ClipboardList, BarChart3, Settings } from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  Icon: IconComponent;
};

/**
 * Gedeelde navigatie-items voor de tabbalk (mobiel) en zijnav (desktop): twee
 * weergaven van dezelfde navigatie. Voor een medewerker verdwijnt Beheer en
 * houdt de tabbalk vier cellen over.
 */
export function buildNavItems({
  slug,
  isBeheerder,
}: {
  slug: string;
  isBeheerder: boolean;
}): NavItem[] {
  const basis = `/${slug}`;
  return [
    { href: `${basis}/scannen`, label: "Scannen", Icon: ScanLine },
    { href: `${basis}/materiaal`, label: "Materiaal", Icon: Package },
    { href: `${basis}/log`, label: "Log", Icon: ClipboardList },
    { href: `${basis}/overzicht`, label: "Overzicht", Icon: BarChart3 },
    ...(isBeheerder ? [{ href: `${basis}/beheer`, label: "Beheer", Icon: Settings }] : []),
  ];
}

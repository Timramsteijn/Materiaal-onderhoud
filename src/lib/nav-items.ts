import type { IconComponent } from "@/components/icons";
import { ScanLine, Package, ClipboardList, BarChart3, Settings, Compass } from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  Icon: IconComponent;
};

/**
 * Gedeelde navigatie-items voor BottomNav (mobiel) en SideNav (desktop) — twee
 * weergaven van dezelfde navigatie. Buiten een onderdeel (bv. de Beheer-pagina
 * zonder herkenbare herkomst) is er geen zinnig doel voor Scannen/Materiaal/
 * Log/Overzicht, dus dan blijft alleen een terugweg naar de onderdelenkeuze
 * (en Beheer voor duty managers) over.
 */
export function buildNavItems({
  departmentId,
  isDutyManager,
}: {
  departmentId?: string | null;
  isDutyManager: boolean;
}): NavItem[] {
  if (!departmentId) {
    return [
      { href: "/onderdeel", label: "Onderdelen", Icon: Compass },
      ...(isDutyManager ? [{ href: "/beheer", label: "Beheer", Icon: Settings }] : []),
    ];
  }

  const base = `/onderdeel/${departmentId}`;
  return [
    { href: `${base}/scan`, label: "Scannen", Icon: ScanLine },
    { href: `${base}/materiaal`, label: "Materiaal", Icon: Package },
    { href: `${base}/log`, label: "Log", Icon: ClipboardList },
    { href: `${base}/overzicht`, label: "Overzicht", Icon: BarChart3 },
    ...(isDutyManager
      ? [{ href: `/beheer?van=${departmentId}`, label: "Beheer", Icon: Settings }]
      : []),
  ];
}

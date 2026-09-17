import type { ReactNode } from "react";
import type { LucideProps } from "lucide-react";
import {
  ScanLine,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Printer,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ArrowRight,
  Check,
  Plus,
  X,
  Download,
  Upload,
  AlertTriangle,
  CircleAlert,
  Lock,
  Trash2,
  UserX,
  WifiOff,
  Bike,
  Target,
  Mountain,
  Waves,
  Compass,
} from "lucide-react";

export {
  ScanLine,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Printer,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ArrowRight,
  Check,
  Plus,
  X,
  Download,
  Upload,
  AlertTriangle,
  CircleAlert,
  Lock,
  Trash2,
  UserX,
  WifiOff,
  Bike,
  Target,
  Mountain,
  Waves,
  Compass,
};

/** Gedeeld type voor plekken die zowel Lucide-iconen als SkiIcon accepteren. */
export type IconComponent = (props: LucideProps) => ReactNode;

/**
 * Lucide heeft geen ski-icoon. Zelfgetekend in dezelfde stijl (24x24 grid,
 * stroke-only, ronde caps/joins) uit twee afgeronde ski's met bindingen en
 * twee stokken.
 */
export function SkiIcon({ size = 24, strokeWidth = 2, ...props }: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="4.5" y="2.5" width="4" height="19" rx="2" />
      <rect x="15.5" y="2.5" width="4" height="19" rx="2" />
      <path d="M4.5 8h4" />
      <path d="M15.5 8h4" />
      <path d="M2 21.5h9" />
      <path d="M13 21.5h9" />
    </svg>
  );
}

/** Iconen per onderdeel, opgezocht op de `icoon`-sleutel uit de database. */
export const ONDERDEEL_ICONEN: Record<string, IconComponent> = {
  ski: SkiIcon,
  bike: Bike,
  target: Target,
  mountain: Mountain,
  waves: Waves,
};

export function onderdeelIcoon(sleutel: string): IconComponent {
  return ONDERDEEL_ICONEN[sleutel] ?? Package;
}

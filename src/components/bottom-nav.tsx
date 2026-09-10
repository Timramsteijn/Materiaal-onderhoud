"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/scan", label: "Scannen", icon: "📷" },
  { href: "/materiaal", label: "Materiaal", icon: "🎿" },
  { href: "/log", label: "Log", icon: "📋" },
  { href: "/overzicht", label: "Overzicht", icon: "📊" },
] as const;

export function BottomNav({ isDutyManager }: { isDutyManager: boolean }) {
  const pathname = usePathname();
  const tabs = isDutyManager
    ? [...TABS, { href: "/beheer", label: "Beheer", icon: "⚙️" } as const]
    : TABS;

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[560px] border-t border-border bg-panel">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
              active ? "text-amber-dark" : "text-ink-soft"
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

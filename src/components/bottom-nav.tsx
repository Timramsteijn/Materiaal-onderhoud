"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildNavItems } from "@/lib/nav-items";

export function BottomNav({
  isDutyManager,
  departmentId,
}: {
  isDutyManager: boolean;
  departmentId?: string;
}) {
  const pathname = usePathname();
  const tabs = buildNavItems({ departmentId, isDutyManager });

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[560px] border-t border-border-dark bg-ink pb-2 desktop:hidden">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href.split("?")[0]);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            className={`flex flex-1 flex-col items-center gap-1 border-t-[3px] pt-2 transition-colors ${
              active
                ? "border-orange text-orange"
                : "border-transparent text-text-dark-secondary hover:border-text-medium"
            }`}
          >
            <tab.Icon size={21} strokeWidth={1.8} />
            <span className="font-display text-[10px] font-extrabold uppercase italic tracking-[0.1em]">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

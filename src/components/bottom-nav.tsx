"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildNavItems } from "@/lib/nav-items";

export function BottomNav({ slug, isBeheerder }: { slug: string; isBeheerder: boolean }) {
  const pathname = usePathname();
  const tabs = buildNavItems({ slug, isBeheerder });

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[560px] border-t border-border-dark bg-navy pb-2 desktop:hidden">
      {tabs.map((tab) => {
        const actief = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            className={`motion flex min-h-[52px] flex-1 flex-col items-center gap-1 border-t-[3px] pt-2 ${
              actief
                ? "border-accent text-accent"
                : "border-transparent text-text-on-dark hover:border-border-dark"
            }`}
          >
            <tab.Icon size={21} strokeWidth={2} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.1em]">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

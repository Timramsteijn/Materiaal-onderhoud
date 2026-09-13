"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildNavItems } from "@/lib/nav-items";
import { Mountain } from "@/components/icons";

export function SideNav({
  isDutyManager,
  departmentId,
  departmentNaam,
}: {
  isDutyManager: boolean;
  departmentId?: string;
  departmentNaam?: string;
}) {
  const pathname = usePathname();
  const items = buildNavItems({ departmentId, isDutyManager });

  return (
    <aside className="no-print hidden w-[232px] shrink-0 flex-col bg-ink py-5 desktop:flex">
      <div className="mb-3 flex items-center gap-2.5 border-b border-border-dark px-5 pb-5">
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border-2 border-orange">
          <Mountain size={17} strokeWidth={2} className="text-orange" />
        </span>
        <p className="font-display text-[13px] font-extrabold uppercase italic leading-tight text-white">
          Materiaal
          <br />
          Onderhoud
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const active = pathname.startsWith(item.href.split("?")[0]);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`flex items-center gap-2.5 rounded-full px-3 py-[11px] transition-colors ${
                active ? "bg-orange text-white" : "text-text-dark-secondary hover:bg-ink-light hover:text-white"
              }`}
            >
              <item.Icon size={18} strokeWidth={1.8} />
              <span className="font-display text-[12.5px] font-bold uppercase italic tracking-[0.04em]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {departmentId && departmentNaam ? (
        <div className="border-t border-border-dark px-5 pt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-dark-secondary">
            Onderdeel
          </p>
          <p className="font-display mt-1 text-[13px] font-extrabold italic uppercase text-orange">
            {departmentNaam}
          </p>
          <Link
            href="/onderdeel"
            prefetch={false}
            className="mt-1 inline-block border-b border-border-dark text-[11.5px] text-text-dark-secondary hover:text-white"
          >
            wissel van onderdeel
          </Link>
        </div>
      ) : null}
    </aside>
  );
}

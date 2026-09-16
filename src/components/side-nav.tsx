"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildNavItems } from "@/lib/nav-items";
import { Logo } from "@/components/logo";

export function SideNav({
  slug,
  onderdeelNaam,
  isBeheerder,
}: {
  slug: string;
  onderdeelNaam: string;
  isBeheerder: boolean;
}) {
  const pathname = usePathname();
  const items = buildNavItems({ slug, isBeheerder });

  return (
    <aside className="no-print hidden w-[232px] shrink-0 flex-col bg-navy py-5 desktop:flex">
      <Link
        href={`/${slug}/scannen`}
        prefetch={false}
        className="mb-4 flex items-center gap-2.5 border-b border-border-dark px-5 pb-5 text-creme"
      >
        <Logo variant="merkteken" size={26} className="text-accent" />
        <span className="font-body text-[13px] font-extrabold uppercase leading-[1.15] tracking-[0.1em]">
          Materiaal
          <br />
          Onderhoud
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const actief = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`motion flex items-center gap-2.5 rounded-full px-3 py-[11px] ${
                actief
                  ? "bg-accent text-accent-on"
                  : "text-text-on-dark hover:bg-navy-light hover:text-creme"
              }`}
            >
              <item.Icon size={18} strokeWidth={2} />
              <span className="text-[12.5px] font-bold uppercase tracking-[0.08em]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-border-dark px-5 pt-4">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-on-dark">
          Onderdeel
        </p>
        <p className="mt-1 text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-accent">
          {onderdeelNaam}
        </p>
        <Link
          href="/onderdeel"
          prefetch={false}
          className="motion mt-1 inline-block border-b border-border-dark text-[11.5px] text-text-on-dark hover:text-creme"
        >
          wissel van onderdeel
        </Link>
      </div>
    </aside>
  );
}

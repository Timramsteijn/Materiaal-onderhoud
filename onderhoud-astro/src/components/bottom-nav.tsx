import { buildNavItems } from "@/lib/nav-items";

export function BottomNav({
  slug,
  isBeheerder,
  heeftBaanschets,
  pad,
}: {
  slug: string;
  isBeheerder: boolean;
  heeftBaanschets?: boolean;
  pad: string;
}) {
  const tabs = buildNavItems({ slug, isBeheerder, heeftBaanschets });

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[560px] border-t border-border-dark bg-navy pb-2 desktop:hidden">
      {tabs.map((tab) => {
        const actief = pad.startsWith(tab.href);
        return (
          <a
            key={tab.href}
            href={tab.href}
            className={`motion flex min-h-[52px] min-w-0 flex-1 flex-col items-center gap-1 border-t-[3px] pt-2 ${
              actief
                ? "border-accent text-accent"
                : "border-transparent text-text-on-dark hover:border-border-dark"
            }`}
          >
            <tab.Icon size={21} strokeWidth={2} />
            {/* min-w-0 + truncate: bij 6 tabbladen (incl. Baanschets) is een
                cel te smal voor "Overzicht" én "Baanschets" naast elkaar —
                zonder dit loopt de tekst door in de buurcel. */}
            <span className="w-full truncate px-0.5 text-center text-[10px] font-extrabold uppercase tracking-[0.1em]">
              {tab.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}

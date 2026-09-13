import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { SkiIcon, Bike, Target, Mountain, Waves, ChevronRight } from "@/components/icons";
import type { IconComponent } from "@/components/icons";

const ICONS: Record<string, IconComponent> = {
  "Ski & Snowboard": SkiIcon,
  Mountainbike: Bike,
  Boogschieten: Target,
  Klimmateriaal: Mountain,
  "Kano & Kajak & SUP": Waves,
};

const UITGELICHT = "Ski & Snowboard";

export default async function OnderdeelKiezenPage() {
  const [session, departments] = await Promise.all([
    auth(),
    prisma.department.findMany({
      orderBy: { naam: "asc" },
      include: { categories: { select: { _count: { select: { materialen: true } } } } },
    }),
  ]);

  return (
    <>
      <AppHeader userNaam={session!.user.naam} />
      <main className="mx-auto max-w-2xl flex-1 px-[18px] pb-10 pt-6">
        <h1 className="text-[22px] text-ink">Kies een onderdeel</h1>
        <p className="mb-5 mt-1 text-[13px] text-text-muted">
          Alles wat je hierna doet valt onder dit onderdeel.
        </p>

        {departments.length === 0 ? (
          <p className="text-[13px] text-text-muted">
            Er zijn nog geen onderdelen aangemaakt. Vraag een duty manager om er een aan te
            maken via Beheer.
          </p>
        ) : (
          <ul className="space-y-3">
            {departments.map((d) => {
              const materiaalCount = d.categories.reduce(
                (sum, c) => sum + c._count.materialen,
                0
              );
              const uitgelicht = d.naam === UITGELICHT;
              const Icon = ICONS[d.naam] ?? SkiIcon;
              return (
                <li key={d.id}>
                  <Link
                    href={`/onderdeel/${d.id}/scan`}
                    prefetch={false}
                    className={`flex items-center gap-3.5 rounded-[10px] bg-card p-4 shadow-[var(--shadow-card-light)] transition-colors ${
                      uitgelicht
                        ? "border-2 border-orange"
                        : "border border-card-border hover:border-steel"
                    }`}
                  >
                    <span
                      className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[10px] ${
                        uitgelicht ? "bg-orange-tint text-orange" : "bg-steel-tint text-steel"
                      }`}
                    >
                      <Icon size={22} strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[17px] font-extrabold italic text-ink">
                        {d.naam}
                      </p>
                      <p className="mt-0.5 text-[13px] text-text-muted">
                        {materiaalCount} {materiaalCount === 1 ? "stuk" : "stuks"}
                        {uitgelicht ? " · meest gebruikt" : ""}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      strokeWidth={1.8}
                      className={uitgelicht ? "shrink-0 text-orange" : "shrink-0 text-text-muted"}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

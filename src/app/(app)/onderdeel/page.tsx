import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

const ICONS: Record<string, string> = {
  "Ski & Snowboard": "🎿",
  Mountainbike: "🚵",
  Boogschieten: "🎯",
  Klimmateriaal: "🧗",
  "Kano & Kajak & SUP": "🛶",
};

export default async function OnderdeelKiezenPage() {
  const [session, departments] = await Promise.all([
    auth(),
    prisma.department.findMany({
      orderBy: { naam: "asc" },
      include: { categories: { select: { _count: { select: { materialen: true } } } } },
    }),
  ]);

  const isDutyManager = session!.user.role === "DUTY_MANAGER";

  return (
    <>
      <AppHeader />
      <main className="flex-1 px-4 pb-24 pt-5">
        <h1 className="mb-1 text-xl text-ink">Kies een onderdeel</h1>
        <p className="mb-4 text-[13px] text-ink-soft">Waar wil je vandaag mee werken?</p>

        {departments.length === 0 ? (
          <p className="text-[13px] text-ink-soft">
            Er zijn nog geen onderdelen aangemaakt. Vraag een duty manager om er een aan te
            maken via Beheer.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {departments.map((d) => {
              const materiaalCount = d.categories.reduce(
                (sum, c) => sum + c._count.materialen,
                0
              );
              return (
                <li key={d.id}>
                  <Link
                    href={`/onderdeel/${d.id}/scan`}
                    className="flex items-center gap-3.5 rounded-2xl bg-panel p-4 shadow-sm"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg text-xl">
                      {ICONS[d.naam] ?? "📦"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="label-font text-[15px] text-ink">{d.naam}</p>
                      <p className="mt-0.5 text-[12px] text-ink-soft">
                        {materiaalCount} {materiaalCount === 1 ? "stuk" : "stuks"} materiaal
                      </p>
                    </div>
                    <span className="shrink-0 text-ink-soft">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav isDutyManager={isDutyManager} />
    </>
  );
}

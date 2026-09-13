import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AANDACHT_NODIG_MAANDEN, ROLE_LABELS, STATUS_LABELS, dagenSinds } from "@/lib/domain";
import { TopBar } from "@/components/top-bar";
import { AlertTriangle, ChevronRight } from "@/components/icons";

export default async function OverzichtPage({
  params,
}: {
  params: Promise<{ departmentId: string }>;
}) {
  const { departmentId } = await params;
  const base = `/onderdeel/${departmentId}`;

  // Server Component: dit rendert per request opnieuw, dus de huidige tijd opvragen is hier correct.
  const nu = new Date();
  const twaalfMaandenGeleden = new Date(nu);
  twaalfMaandenGeleden.setMonth(twaalfMaandenGeleden.getMonth() - 12);

  const [session, categories, perCategorie, perStatus, perActie, materialenMetLaatsteBeurt] =
    await Promise.all([
      auth(),
      prisma.category.findMany({ where: { departmentId }, orderBy: { naam: "asc" } }),
      prisma.material.groupBy({
        by: ["categoryId"],
        where: { category: { departmentId } },
        _count: { _all: true },
      }),
      prisma.material.groupBy({
        by: ["status"],
        where: { category: { departmentId } },
        _count: { _all: true },
      }),
      prisma.maintenanceLog.groupBy({
        by: ["actie"],
        where: { material: { category: { departmentId } }, datum: { gte: twaalfMaandenGeleden } },
        _count: { _all: true },
        orderBy: { _count: { actie: "desc" } },
      }),
      prisma.material.findMany({
        where: { category: { departmentId } },
        select: {
          id: true,
          merk: true,
          model: true,
          maat: true,
          status: true,
          aangemaakt: true,
          category: { select: { naam: true } },
          logs: { orderBy: { datum: "desc" }, take: 1, select: { datum: true } },
        },
      }),
    ]);

  const maxActieCount = Math.max(1, ...perActie.map((a) => a._count._all));
  const totaalRegistraties = perActie.reduce((sum, a) => sum + a._count._all, 0);
  const maxCategorieCount = Math.max(1, ...perCategorie.map((c) => c._count._all));

  const aandachtNodig = materialenMetLaatsteBeurt
    .map((m) => {
      const laatsteBeurt = m.logs[0]?.datum ?? null;
      return { ...m, laatsteBeurt, dagenGeleden: dagenSinds(laatsteBeurt ?? m.aangemaakt) };
    })
    .filter((m) => m.dagenGeleden > AANDACHT_NODIG_MAANDEN * 30)
    .sort((a, b) => b.dagenGeleden - a.dagenGeleden)
    .slice(0, 15);

  const totaalMateriaal = perCategorie.reduce((sum, c) => sum + c._count._all, 0);
  const perStatusMap = {
    IN_GEBRUIK: perStatus.find((p) => p.status === "IN_GEBRUIK")?._count._all ?? 0,
    IN_REPARATIE: perStatus.find((p) => p.status === "IN_REPARATIE")?._count._all ?? 0,
    BUITEN_GEBRUIK: perStatus.find((p) => p.status === "BUITEN_GEBRUIK")?._count._all ?? 0,
  };

  return (
    <>
      <TopBar userNaam={session!.user.naam} userRoleLabel={ROLE_LABELS[session!.user.role]}>
        <div>
          <p className="font-display text-[15px] font-extrabold italic uppercase tracking-[0.04em] text-ink">
            Overzicht
          </p>
          <p className="text-[11.5px] text-text-muted">
            Bijgewerkt vandaag{" "}
            {nu.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </TopBar>

      <div className="px-[18px] pb-8 pt-4 desktop:px-6 desktop:pt-6">
        <h1 className="text-[22px] text-ink desktop:hidden">Overzicht</h1>
        <p className="mb-4 mt-0.5 text-[12.5px] text-text-muted desktop:hidden">
          Bijgewerkt vandaag{" "}
          {nu.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
        </p>

        <div className="grid grid-cols-2 gap-2.5 desktop:grid-cols-4">
          <StatTile n={totaalMateriaal} label="Totaal materiaal" variant="dark" />
          <StatTile n={perStatusMap.IN_GEBRUIK} label={STATUS_LABELS.IN_GEBRUIK} variant="green" />
          <StatTile n={perStatusMap.IN_REPARATIE} label={STATUS_LABELS.IN_REPARATIE} variant="orange" />
          <StatTile n={perStatusMap.BUITEN_GEBRUIK} label={STATUS_LABELS.BUITEN_GEBRUIK} variant="red" />
        </div>

        <div className="mt-5 desktop:grid desktop:grid-cols-[1.15fr_1fr] desktop:gap-4">
          <div className="rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-ink">
              Onderhoud per actie
            </h2>
            <p className="mb-3 text-[11.5px] text-text-muted">
              Laatste 12 maanden · {totaalRegistraties} registraties
            </p>
            {perActie.length === 0 ? (
              <p className="text-[13px] text-text-muted">Nog geen onderhoud geregistreerd.</p>
            ) : (
              <div className="flex items-end gap-2.5">
                {perActie.map((a) => (
                  <div key={a.actie} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-ink">{a._count._all}</span>
                    <div className="flex h-[150px] w-full flex-col justify-end desktop:h-[190px]">
                      <div
                        className={`w-full rounded-t ${
                          a.actie === "Afkeuren" ? "bg-red" : "bg-orange"
                        }`}
                        style={{ height: `${(a._count._all / maxActieCount) * 100}%` }}
                      />
                    </div>
                    <span className="truncate text-[10.5px] text-text-dark-secondary">{a.actie}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)] desktop:mt-0">
            <h2 className="font-display mb-3 text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-ink">
              Per categorie
            </h2>
            <div className="space-y-2.5">
              {categories.map((c) => {
                const count = perCategorie.find((p) => p.categoryId === c.id)?._count._all ?? 0;
                return (
                  <div key={c.id}>
                    <div className="flex justify-between text-[12.5px] text-ink">
                      <span>{c.naam}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="mt-1 h-[7px] overflow-hidden rounded-full bg-bg">
                      <div
                        className="h-full rounded-full bg-steel"
                        style={{ width: `${(count / maxCategorieCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={16} strokeWidth={2} className="text-red" />
            <h2 className="font-display text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-red">
              Aandacht nodig
            </h2>
          </div>
          <p className="mb-3 mt-0.5 text-[11.5px] text-text-muted">
            Langer dan {AANDACHT_NODIG_MAANDEN} maanden geen groot onderhoud.
          </p>
          {aandachtNodig.length === 0 ? (
            <p className="text-[13px] text-text-muted">Geen materiaal met achterstallig onderhoud.</p>
          ) : (
            <ul className="space-y-2 desktop:space-y-0 desktop:divide-y desktop:divide-bg">
              {aandachtNodig.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`${base}/materiaal?id=${encodeURIComponent(m.id)}`}
                    prefetch={false}
                    className="flex items-center justify-between gap-3 rounded-xl px-1 py-2.5 hover:bg-bg desktop:rounded-none desktop:px-0"
                  >
                    <span className="font-display w-[90px] shrink-0 text-[14px] font-extrabold italic text-ink desktop:w-[110px]">
                      {m.id}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-text-medium">
                      {m.merk} {m.model}
                      {m.maat ? ` ${m.maat}` : ""}
                    </span>
                    <span className="shrink-0 rounded-full bg-red-tint px-2.5 py-1 text-[11px] font-semibold text-red">
                      {m.dagenGeleden} dgn
                    </span>
                    <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

const TILE_STYLES = {
  dark: "bg-ink text-white",
  green: "bg-card text-green-text",
  orange: "bg-card text-orange-hover",
  red: "bg-card text-red",
} as const;

function StatTile({
  n,
  label,
  variant,
}: {
  n: number;
  label: string;
  variant: keyof typeof TILE_STYLES;
}) {
  return (
    <div
      className={`rounded-[10px] p-3.5 text-center shadow-[var(--shadow-card-light)] ${TILE_STYLES[variant]}`}
    >
      <p className="font-display text-[34px] font-extrabold italic leading-tight desktop:text-[40px]">
        {n}
      </p>
      <p
        className={`mt-0.5 text-[11px] ${variant === "dark" ? "text-text-dark-secondary" : "text-text-muted"}`}
      >
        {label}
      </p>
    </div>
  );
}

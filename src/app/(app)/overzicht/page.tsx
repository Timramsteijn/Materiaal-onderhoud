import { prisma } from "@/lib/prisma";
import { GROTE_BEURT_TREFWOORD, STATUS_LABELS } from "@/lib/domain";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";

export default async function OverzichtPage() {
  const [categories, perCategorie, perStatus, perActie, materialenMetLaatsteBeurt] =
    await Promise.all([
      prisma.category.findMany({ orderBy: { naam: "asc" } }),
      prisma.material.groupBy({ by: ["categoryId"], _count: { _all: true } }),
      prisma.material.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.maintenanceLog.groupBy({
        by: ["actie"],
        _count: { _all: true },
        orderBy: { _count: { actie: "desc" } },
      }),
      prisma.material.findMany({
        select: {
          id: true,
          merk: true,
          model: true,
          status: true,
          category: { select: { naam: true } },
          logs: {
            where: { actie: { contains: GROTE_BEURT_TREFWOORD, mode: "insensitive" } },
            orderBy: { datum: "desc" },
            take: 1,
            select: { datum: true },
          },
        },
      }),
    ]);

  const maxActieCount = Math.max(1, ...perActie.map((a) => a._count._all));

  // Server Component: dit rendert per request opnieuw, dus de huidige tijd opvragen is hier correct.
  // eslint-disable-next-line react-hooks/purity
  const nu = Date.now();
  const aandachtNodig = materialenMetLaatsteBeurt
    .map((m) => {
      const laatsteBeurt = m.logs[0]?.datum ?? null;
      return {
        ...m,
        laatsteBeurt,
        dagenGeleden: laatsteBeurt ? Math.floor((nu - laatsteBeurt.getTime()) / 86_400_000) : null,
      };
    })
    .sort((a, b) => {
      if (!a.laatsteBeurt && !b.laatsteBeurt) return a.id.localeCompare(b.id);
      if (!a.laatsteBeurt) return -1;
      if (!b.laatsteBeurt) return 1;
      return a.laatsteBeurt.getTime() - b.laatsteBeurt.getTime();
    })
    .slice(0, 15);

  const totaalMateriaal = perCategorie.reduce((sum, c) => sum + c._count._all, 0);

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-3 text-xl text-ink">Overzicht</h1>

      <div className="grid grid-cols-3 gap-2">
        <StatTile n={totaalMateriaal} label="Totaal materiaal" />
        {categories.map((c) => (
          <StatTile
            key={c.id}
            n={perCategorie.find((p) => p.categoryId === c.id)?._count._all ?? 0}
            label={c.naam}
          />
        ))}
      </div>

      <h2 className="mb-2 mt-5 text-[15px] text-ink">Status</h2>
      <div className="grid grid-cols-3 gap-2">
        {(["IN_GEBRUIK", "IN_REPARATIE", "BUITEN_GEBRUIK"] as const).map((s) => (
          <StatTile
            key={s}
            n={perStatus.find((p) => p.status === s)?._count._all ?? 0}
            label={STATUS_LABELS[s]}
          />
        ))}
      </div>

      <h2 className="mb-2 mt-5 text-[15px] text-ink">Onderhoud per actie</h2>
      {perActie.length === 0 ? (
        <p className="text-[13px] text-ink-soft">Nog geen onderhoud geregistreerd.</p>
      ) : (
        <div className="space-y-2.5 rounded-2xl bg-panel p-4 shadow-sm">
          {perActie.map((a) => (
            <div key={a.actie}>
              <div className="flex justify-between text-[12.5px] text-ink">
                <span>{a.actie}</span>
                <span className="font-semibold">{a._count._all}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full bg-ice"
                  style={{ width: `${(a._count._all / maxActieCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-2 mt-5 text-[15px] text-ink">Aandacht nodig</h2>
      <p className="mb-2 text-[12px] text-ink-soft">
        Materiaal dat het langst geleden (of nooit) een algehele onderhoudsbeurt kreeg.
      </p>
      {aandachtNodig.length === 0 ? (
        <p className="text-[13px] text-ink-soft">Geen materiaal geregistreerd.</p>
      ) : (
        <ul className="space-y-2">
          {aandachtNodig.map((m) => (
            <li key={m.id}>
              <Link
                href={`/materiaal/${encodeURIComponent(m.id)}`}
                prefetch={false}
                className="flex items-center justify-between rounded-xl bg-panel px-3.5 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="label-font text-[14px] text-ink">
                    {m.id}{" "}
                    <span className="ml-1 rounded bg-bg px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-soft">
                      {m.category.naam}
                    </span>
                  </p>
                  <p className="truncate text-[12px] text-ink-soft">
                    {m.merk} {m.model}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-[12.5px] font-semibold ${
                      m.laatsteBeurt ? "text-ink-soft" : "text-danger"
                    }`}
                  >
                    {m.dagenGeleden !== null ? `${m.dagenGeleden} dagen geleden` : "Nooit"}
                  </p>
                  <StatusBadge status={m.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatTile({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl bg-panel p-3 text-center shadow-sm">
      <p className="label-font text-2xl text-ink">{n}</p>
      <p className="mt-0.5 text-[11px] text-ink-soft">{label}</p>
    </div>
  );
}

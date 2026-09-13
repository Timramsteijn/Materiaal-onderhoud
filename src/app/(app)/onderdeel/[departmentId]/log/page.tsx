import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function LogPage({
  params,
  searchParams,
}: {
  params: Promise<{ departmentId: string }>;
  searchParams: Promise<{ categorie?: string; actie?: string; materiaal?: string }>;
}) {
  const { departmentId } = await params;
  const { categorie, actie, materiaal } = await searchParams;
  const base = `/onderdeel/${departmentId}`;

  const categories = await prisma.category.findMany({
    where: { departmentId },
    orderBy: { naam: "asc" },
  });
  const alleActies = Array.from(new Set(categories.flatMap((c) => c.acties))).sort();

  const logs = await prisma.maintenanceLog.findMany({
    where: {
      actie: actie || undefined,
      materialId: materiaal || undefined,
      material: { category: { departmentId, ...(categorie ? { id: categorie } : {}) } },
    },
    orderBy: { datum: "desc" },
    take: 50,
    include: {
      material: { select: { id: true, merk: true, model: true, category: true } },
      uitgevoerdDoor: { select: { naam: true } },
    },
  });

  return (
    <div className="px-[18px] pb-8 pt-4 desktop:px-6 desktop:pt-6">
      <h1 className="text-[22px] text-ink">Onderhoudslog</h1>

      {materiaal && (
        <p className="mt-1 text-[12.5px] text-text-muted">
          Gefilterd op materiaal {materiaal} ·{" "}
          <Link href={`${base}/log`} className="text-steel-dark">
            wis filter
          </Link>
        </p>
      )}

      <form className="mb-4 mt-3 flex gap-2" action={`${base}/log`}>
        {categories.length > 1 && (
          <select
            name="categorie"
            defaultValue={categorie ?? ""}
            className="flex-1 rounded-lg border border-border-light bg-card px-3 py-2 text-[13px] text-ink"
          >
            <option value="">Alle categorieen</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.naam}
              </option>
            ))}
          </select>
        )}
        <select
          name="actie"
          defaultValue={actie ?? ""}
          className="flex-1 rounded-lg border border-border-light bg-card px-3 py-2 text-[13px] text-ink"
        >
          <option value="">Alle acties</option>
          {alleActies.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-white"
        >
          Filter
        </button>
      </form>

      {logs.length === 0 ? (
        <div className="rounded-[10px] bg-card py-10 text-center text-[13px] text-text-muted shadow-[var(--shadow-card-light)]">
          Geen logboekregels gevonden.
        </div>
      ) : (
        <ul className="space-y-2.5 desktop:grid desktop:grid-cols-2 desktop:gap-2.5 desktop:space-y-0">
          {logs.map((log) => (
            <li key={log.id} className="rounded-[10px] bg-card p-3.5 shadow-[var(--shadow-card-light)]">
              <div className="flex items-center justify-between">
                <Link
                  href={`${base}/materiaal?id=${encodeURIComponent(log.material.id)}`}
                  prefetch={false}
                  className="font-display text-[13.5px] font-extrabold italic text-ink"
                >
                  {log.material.id}{" "}
                  <span className="ml-1 rounded bg-steel-tint px-1.5 py-0.5 text-[10px] font-semibold not-italic text-steel-dark">
                    {log.material.category.naam}
                  </span>
                </Link>
                <span className="text-[11.5px] text-text-dark-secondary">
                  {log.datum.toLocaleDateString("nl-NL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-ink">{log.actie}</p>
              <p className="text-[12px] text-text-muted">
                {log.material.merk} {log.material.model} · door {log.uitgevoerdDoor.naam}
              </p>
              {log.opmerkingen && (
                <p className="mt-1 text-[12.5px] italic text-text-medium">{log.opmerkingen}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

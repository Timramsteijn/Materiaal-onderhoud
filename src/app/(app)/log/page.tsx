import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; actie?: string }>;
}) {
  const { categorie, actie } = await searchParams;

  const categories = await prisma.category.findMany({ orderBy: { naam: "asc" } });
  const alleActies = Array.from(new Set(categories.flatMap((c) => c.acties))).sort();

  const logs = await prisma.maintenanceLog.findMany({
    where: {
      actie: actie || undefined,
      material: categorie ? { categoryId: categorie } : undefined,
    },
    orderBy: { datum: "desc" },
    take: 50,
    include: {
      material: { select: { id: true, merk: true, model: true, category: true } },
      uitgevoerdDoor: { select: { naam: true } },
    },
  });

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-3 text-xl text-ink">Onderhoudslog</h1>

      <form className="mb-3 flex gap-2" action="/log">
        <select
          name="categorie"
          defaultValue={categorie ?? ""}
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink"
        >
          <option value="">Alle categorieen</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.naam}
            </option>
          ))}
        </select>
        <select
          name="actie"
          defaultValue={actie ?? ""}
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink"
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
          className="rounded-lg bg-graphite px-3.5 py-2 text-[13px] font-semibold text-white"
        >
          Filter
        </button>
      </form>

      {logs.length === 0 ? (
        <div className="rounded-xl bg-panel py-10 text-center text-ink-soft">
          Geen logboekregels gevonden.
        </div>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="rounded-xl bg-panel p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <Link
                  href={`/materiaal/${encodeURIComponent(log.material.id)}`}
                  prefetch={false}
                  className="label-font text-[13.5px] text-ink"
                >
                  {log.material.id}{" "}
                  <span className="ml-1 rounded bg-bg px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">
                    {log.material.category.naam}
                  </span>
                </Link>
                <span className="text-[11.5px] text-ink-soft">
                  {log.datum.toLocaleDateString("nl-NL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-ink">{log.actie}</p>
              <p className="text-[12px] text-ink-soft">
                {log.material.merk} {log.material.model} · door {log.uitgevoerdDoor.naam}
              </p>
              {log.opmerkingen && (
                <p className="mt-1 text-[12.5px] italic text-ink-soft">{log.opmerkingen}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

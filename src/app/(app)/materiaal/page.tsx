import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";

export default async function MateriaalPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; q?: string }>;
}) {
  const { categorie, q } = await searchParams;

  const [categories, materialen] = await Promise.all([
    prisma.category.findMany({ orderBy: { naam: "asc" } }),
    prisma.material.findMany({
      where: {
        categoryId: categorie || undefined,
        ...(q
          ? {
              OR: [
                { id: { contains: q, mode: "insensitive" } },
                { merk: { contains: q, mode: "insensitive" } },
                { model: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: { id: "asc" },
    }),
  ]);

  return (
    <div className="px-4 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl text-ink">Materiaal</h1>
        <Link
          href="/materiaal/nieuw"
          className="rounded-full bg-amber px-3.5 py-1.5 text-[13px] font-semibold text-graphite"
        >
          + Nieuw
        </Link>
      </div>

      <form className="mb-3 flex gap-2" action="/materiaal">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Zoek op ID, merk of model..."
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
        />
        {categorie && <input type="hidden" name="categorie" value={categorie} />}
      </form>

      <div className="no-scrollbar mb-3 flex items-center gap-2 overflow-x-auto">
        <FilterPill href="/materiaal" active={!categorie} label="Alles" />
        {categories.map((c) => (
          <FilterPill
            key={c.id}
            href={`/materiaal?categorie=${c.id}`}
            active={categorie === c.id}
            label={c.naam}
          />
        ))}
      </div>

      {materialen.length > 0 && (
        <Link
          href={`/materiaal/print${categorie ? `?categorie=${categorie}` : ""}`}
          className="mb-3 inline-block text-[12.5px] font-semibold text-ice-dark"
        >
          🖨️ Printvel voor {categorie ? "deze selectie" : "alle materiaal"} ({materialen.length})
        </Link>
      )}

      {materialen.length === 0 ? (
        <div className="rounded-xl bg-panel py-10 text-center text-ink-soft">
          Geen materiaal gevonden.
        </div>
      ) : (
        <ul className="space-y-2">
          {materialen.map((m) => (
            <li key={m.id}>
              <Link
                href={`/materiaal/${encodeURIComponent(m.id)}`}
                prefetch={false}
                className="flex items-center justify-between rounded-xl bg-panel px-3.5 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="label-font text-[15px] text-ink">
                    {m.id}{" "}
                    <span className="ml-1 rounded bg-bg px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-soft">
                      {m.category.naam}
                    </span>
                  </p>
                  <p className="truncate text-[12.5px] text-ink-soft">
                    {m.merk} {m.model}
                    {m.maat ? ` · ${m.maat}` : ""}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${
        active
          ? "border-graphite bg-graphite text-white"
          : "border-border bg-panel text-ink-soft"
      }`}
    >
      {label}
    </Link>
  );
}

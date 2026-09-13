import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/domain";
import { MaterialCard } from "./material-card";
import { MaterialDetail } from "./material-detail";
import { SearchBar } from "./search-bar";
import { TopBar } from "@/components/top-bar";
import { Plus, ScanLine } from "@/components/icons";

export default async function MateriaalPage({
  params,
  searchParams,
}: {
  params: Promise<{ departmentId: string }>;
  searchParams: Promise<{ categorie?: string; q?: string; id?: string }>;
}) {
  const { departmentId } = await params;
  const { categorie, q, id } = await searchParams;
  const base = `/onderdeel/${departmentId}`;
  const listHref = (extra?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (categorie) p.set("categorie", categorie);
    if (q) p.set("q", q);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (v) p.set(k, v);
        else p.delete(k);
      }
    }
    const qs = p.toString();
    return `${base}/materiaal${qs ? `?${qs}` : ""}`;
  };

  const [session, categories, materialen] = await Promise.all([
    auth(),
    prisma.category.findMany({ where: { departmentId }, orderBy: { naam: "asc" } }),
    prisma.material.findMany({
      where: {
        category: { departmentId },
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
      include: {
        category: { select: { naam: true } },
        logs: { orderBy: { datum: "desc" }, take: 1, select: { datum: true } },
      },
      orderBy: { id: "asc" },
    }),
  ]);

  let materiaalDetail = null;
  if (id) {
    const found = await prisma.material.findUnique({
      where: { id },
      include: {
        category: { select: { naam: true, acties: true, extraVeldLabel: true, departmentId: true } },
        logs: {
          orderBy: { datum: "desc" },
          take: 10,
          include: { uitgevoerdDoor: { select: { naam: true } } },
        },
        _count: { select: { logs: true } },
      },
    });
    if (found && found.category.departmentId !== departmentId) {
      redirect(`/onderdeel/${found.category.departmentId}/materiaal?id=${encodeURIComponent(id)}`);
    }
    materiaalDetail = found;
  }

  const heeftDetail = Boolean(id);
  const actieveCategorieNaam = categories.find((c) => c.id === categorie)?.naam;

  return (
    <>
      <TopBar userNaam={session!.user.naam} userRoleLabel={ROLE_LABELS[session!.user.role]}>
        <SearchBar />
        <Link
          href={`${base}/scan`}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-orange px-4 text-[13px] font-bold uppercase tracking-[0.03em] text-white transition-colors hover:bg-orange-hover"
        >
          <ScanLine size={16} strokeWidth={2} />
          QR scannen
        </Link>
      </TopBar>

      <div className="desktop:flex desktop:items-start">
        <div
          className={`${heeftDetail ? "hidden desktop:block" : "block"} px-[18px] pt-4 desktop:w-[392px] desktop:shrink-0 desktop:border-r desktop:border-border-light desktop:px-4 desktop:pt-5`}
        >
          <div className="flex gap-2 desktop:hidden">
            <SearchBar />
            <Link
              href={`${base}/materiaal/nieuw`}
              aria-label="Nieuw materiaal"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink text-white"
            >
              <Plus size={20} strokeWidth={2.2} />
            </Link>
          </div>

          {categories.length > 1 && (
            <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto">
              <FilterPill
                href={listHref({ categorie: undefined, id: undefined })}
                active={!categorie}
                label="Alles"
              />
              {categories.map((c) => (
                <FilterPill
                  key={c.id}
                  href={listHref({ categorie: c.id, id: undefined })}
                  active={categorie === c.id}
                  label={c.naam}
                />
              ))}
            </div>
          )}

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <p className="text-[12px] text-text-muted">
              {materialen.length} {materialen.length === 1 ? "stuk" : "stuks"}
              {actieveCategorieNaam ? ` · ${actieveCategorieNaam}` : ""}
            </p>
            <div className="flex items-center gap-3">
              {materialen.length > 0 && (
                <Link
                  href={`${base}/materiaal/print${categorie ? `?categorie=${categorie}` : ""}`}
                  className="text-[11.5px] font-semibold text-steel-dark"
                >
                  printvel
                </Link>
              )}
              <Link
                href={`${base}/materiaal/nieuw`}
                className="hidden text-[11.5px] font-semibold text-steel-dark desktop:inline"
              >
                + nieuw
              </Link>
            </div>
          </div>

          {materialen.length === 0 ? (
            <div className="mt-3 rounded-[10px] border border-dashed border-card-border bg-card py-10 text-center text-[13px] text-text-muted">
              Geen materiaal gevonden.
            </div>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {materialen.map((m) => (
                <li key={m.id}>
                  <MaterialCard
                    material={m}
                    href={listHref({ id: m.id })}
                    active={id === m.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${heeftDetail ? "block" : "hidden desktop:block"} min-w-0 flex-1`}>
          {materiaalDetail ? (
            <MaterialDetail
              material={materiaalDetail}
              role={session!.user.role}
              base={base}
              userNaam={session!.user.naam}
              backHref={listHref({ id: undefined })}
            />
          ) : (
            <div className="hidden h-full items-center justify-center p-10 text-center text-[13px] text-text-muted desktop:flex">
              Selecteer materiaal uit de lijst om details te bekijken.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`shrink-0 rounded-full border px-3.5 py-[9px] font-display text-[11.5px] font-bold uppercase italic transition-colors ${
        active
          ? "border-ink bg-ink text-orange"
          : "border-border-light bg-card text-text-medium hover:border-steel"
      }`}
    >
      {label}
    </Link>
  );
}

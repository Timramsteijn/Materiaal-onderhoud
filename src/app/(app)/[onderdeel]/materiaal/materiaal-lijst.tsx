import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCategorieen } from "@/lib/onderdeel";
import { formatDatum } from "@/lib/domain";
import { StatusBadge, CategorieBadge, Pill, LegeToestand, OutlineKnop } from "@/components/ui";
import { Search, Plus } from "@/components/icons";
import { Zoekveld } from "./zoekveld";
import type { Status } from "@prisma/client";

export type LijstFilters = { q?: string; categorie?: string };

export async function haalMateriaal(onderdeelId: string, filters: LijstFilters) {
  const q = filters.q?.trim();
  const [totaal, materiaal] = await Promise.all([
    prisma.materiaal.count({ where: { onderdeelId } }),
    prisma.materiaal.findMany({
      where: {
        onderdeelId,
        categorieId: filters.categorie || undefined,
        ...(q
          ? {
              OR: [
                { materiaalId: { contains: q, mode: "insensitive" } },
                { merkModel: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { categorie: { select: { naam: true } } },
      orderBy: { materiaalId: "asc" },
    }),
  ]);
  return { totaal, materiaal };
}

type Rij = {
  id: string;
  materiaalId: string;
  merkModel: string;
  locatie: string;
  status: Status;
  laatsteOnderhoud: Date | null;
  categorie: { naam: string };
};

/**
 * De materiaallijst. Op desktop is dit de linkerkolom van de master/detail;
 * op mobiel het hele scherm. `actiefId` markeert het geopende materiaal.
 */
export async function MateriaalLijst({
  slug,
  onderdeelId,
  onderdeelNaam,
  filters,
  actiefId,
}: {
  slug: string;
  onderdeelId: string;
  onderdeelNaam: string;
  filters: LijstFilters;
  actiefId?: string;
}) {
  const [{ totaal, materiaal }, categorieen] = await Promise.all([
    haalMateriaal(onderdeelId, filters),
    getCategorieen(onderdeelId),
  ]);

  const basis = `/${slug}/materiaal`;
  const href = (extra: LijstFilters) => {
    const p = new URLSearchParams();
    const q = extra.q ?? filters.q;
    const categorie = "categorie" in extra ? extra.categorie : filters.categorie;
    if (q) p.set("q", q);
    if (categorie) p.set("categorie", categorie);
    const qs = p.toString();
    return qs ? `${basis}?${qs}` : basis;
  };

  const actieveCategorie = categorieen.find((c) => c.id === filters.categorie);

  return (
    <div className="px-[18px] pt-4 desktop:px-4 desktop:pt-5">
      <div className="flex gap-2 desktop:hidden">
        <Zoekveld placeholder="Zoek op ID, merk of model" />
        <Link
          href={`${basis}/nieuw`}
          prefetch={false}
          aria-label="Nieuw materiaal"
          className="motion flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-on hover:bg-accent-pressed"
        >
          <Plus size={20} strokeWidth={2} />
        </Link>
      </div>

      {categorieen.length > 0 && (
        <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto desktop:flex-wrap">
          <Pill href={href({ categorie: undefined })} actief={!filters.categorie}>
            Alles
          </Pill>
          {categorieen.map((c) => (
            <Pill key={c.id} href={href({ categorie: c.id })} actief={filters.categorie === c.id}>
              {c.naam}
            </Pill>
          ))}
        </div>
      )}

      <p className="mt-2.5 text-[12px] text-text-muted">
        {materiaal.length} van {totaal} stuks
        {actieveCategorie ? ` · ${actieveCategorie.naam}` : " · alle categorieën"}
      </p>

      {materiaal.length === 0 ? (
        <div className="mt-3">
          <LegeToestand
            icoon={<Search size={26} strokeWidth={2} />}
            kop="Geen materiaal gevonden"
            uitleg={
              filters.q
                ? `Geen materiaal in ${onderdeelNaam} dat overeenkomt met "${filters.q}"${
                    actieveCategorie ? ` binnen ${actieveCategorie.naam}` : ""
                  }.`
                : `Er staat nog geen materiaal in ${onderdeelNaam}${
                    actieveCategorie ? ` binnen ${actieveCategorie.naam}` : ""
                  }.`
            }
            acties={
              <>
                {(filters.q || filters.categorie) && (
                  <OutlineKnop href={basis}>Filter wissen</OutlineKnop>
                )}
                <Link
                  href={`${basis}/nieuw`}
                  prefetch={false}
                  className="motion lift flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed"
                >
                  <Plus size={16} strokeWidth={2} />
                  Nieuw
                </Link>
              </>
            }
          />
        </div>
      ) : (
        <ul className="mt-3 space-y-2.5 pb-4">
          {materiaal.map((m: Rij) => (
            <li key={m.id}>
              <MateriaalKaart
                materiaal={m}
                href={`${basis}/${encodeURIComponent(m.materiaalId)}`}
                actief={actiefId === m.materiaalId}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MateriaalKaart({
  materiaal,
  href,
  actief,
}: {
  materiaal: Rij;
  href: string;
  actief: boolean;
}) {
  const meta = [
    materiaal.locatie,
    materiaal.laatsteOnderhoud
      ? `laatste onderhoud ${formatDatum(materiaal.laatsteOnderhoud)}`
      : "nog geen onderhoud",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={href}
      prefetch={false}
      className={`motion flex items-center justify-between gap-3 rounded-card border bg-creme p-3.5 shadow-[var(--shadow-light)] hover:shadow-[var(--shadow-hover)] ${
        actief ? "border-accent" : "border-border-light hover:border-accent"
      }`}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-1.5">
          <span className="text-[16px] font-extrabold tracking-[0.02em] text-ink">
            {materiaal.materiaalId}
          </span>
          <CategorieBadge naam={materiaal.categorie.naam} />
        </p>
        <p className="truncate text-[13.5px] text-text-medium">{materiaal.merkModel}</p>
        <p className="truncate text-[12px] text-text-muted">{meta}</p>
      </div>
      <StatusBadge status={materiaal.status} />
    </Link>
  );
}

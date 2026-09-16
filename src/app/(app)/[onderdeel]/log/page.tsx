import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOnderdeel, getCategorieen } from "@/lib/onderdeel";
import { dagKop, formatTijd } from "@/lib/domain";
import { TopBar } from "@/components/top-bar";
import { StatusBadge, CategorieBadge, LegeToestand, OutlineKnop } from "@/components/ui";
import { ClipboardList, Download } from "@/components/icons";
import { Zoekveld } from "../materiaal/zoekveld";
import { LogFilters } from "./log-filters";
import type { Status } from "@prisma/client";

function maandenGeleden(aantal: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - aantal);
  return d;
}

export default async function LogPage({
  params,
  searchParams,
}: {
  params: Promise<{ onderdeel: string }>;
  searchParams: Promise<{
    q?: string;
    categorie?: string;
    actie?: string;
    medewerker?: string;
    status?: string;
    materiaal?: string;
  }>;
}) {
  const [{ onderdeel: slug }, filters] = await Promise.all([params, searchParams]);
  const [session, onderdeel] = await Promise.all([auth(), getOnderdeel(slug)]);

  const q = filters.q?.trim();
  const twaalfMaanden = maandenGeleden(12);

  const [regels, categorieen, acties, medewerkers, aantal12Maanden] = await Promise.all([
    prisma.logRegel.findMany({
      where: {
        materiaal: {
          onderdeelId: onderdeel.id,
          categorieId: filters.categorie || undefined,
          materiaalId: filters.materiaal
            ? filters.materiaal
            : q
              ? { contains: q, mode: "insensitive" }
              : undefined,
        },
        actieNaam: filters.actie || undefined,
        medewerkerNaam: filters.medewerker || undefined,
        statusNa: (filters.status as Status | undefined) || undefined,
      },
      orderBy: { tijdstip: "desc" },
      take: 200,
      include: {
        materiaal: {
          select: { materiaalId: true, merkModel: true, categorie: { select: { naam: true } } },
        },
      },
    }),
    getCategorieen(onderdeel.id),
    prisma.onderhoudsActie.findMany({
      where: { categorie: { onderdeelId: onderdeel.id } },
      select: { naam: true },
      distinct: ["naam"],
      orderBy: { naam: "asc" },
    }),
    prisma.medewerker.findMany({ where: { actief: true }, select: { naam: true }, orderBy: { naam: "asc" } }),
    prisma.logRegel.count({
      where: { materiaal: { onderdeelId: onderdeel.id }, tijdstip: { gte: twaalfMaanden } },
    }),
  ]);

  // Groeperen per dag, in volgorde van nieuw naar oud.
  const groepen = new Map<string, typeof regels>();
  for (const regel of regels) {
    const kop = dagKop(regel.tijdstip);
    const bestaand = groepen.get(kop);
    if (bestaand) bestaand.push(regel);
    else groepen.set(kop, [regel]);
  }

  const heeftFilter = Boolean(
    filters.q || filters.categorie || filters.actie || filters.medewerker || filters.status || filters.materiaal
  );

  return (
    <>
      <TopBar
        titel="Onderhoudslog"
        subregel={`${aantal12Maanden} registraties in de laatste 12 maanden`}
        medewerkerNaam={session!.user.naam}
        functie={session!.user.functie}
      >
        <a
          href={`/api/export?onderdeel=${slug}`}
          className="motion ml-auto flex h-10 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-ink px-4 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-ink hover:bg-neutral-fill"
        >
          <Download size={15} strokeWidth={2} />
          Exporteren
        </a>
      </TopBar>

      <main className="flex-1 px-[18px] pb-24 pt-4 desktop:px-6 desktop:pb-8 desktop:pt-5">
        <h1 className="display text-[22px] text-ink desktop:hidden">Onderhoudslog</h1>

        <div className="mt-3 desktop:mt-0 desktop:max-w-[340px]">
          <Zoekveld placeholder="Zoek op Materiaal-ID" />
        </div>

        <LogFilters
          categorieen={categorieen.map((c) => ({ id: c.id, naam: c.naam }))}
          acties={acties.map((a) => a.naam)}
          medewerkers={medewerkers.map((m) => m.naam)}
        />

        {filters.materiaal && (
          <p className="mt-2 text-[12.5px] text-text-muted">
            Alleen registraties van {filters.materiaal} ·{" "}
            <Link href={`/${slug}/log`} className="font-semibold text-link hover:underline">
              toon alles
            </Link>
          </p>
        )}

        {regels.length === 0 ? (
          <div className="mt-4">
            <LegeToestand
              icoon={<ClipboardList size={26} strokeWidth={2} />}
              kop="Geen registraties gevonden"
              uitleg={`Er zijn geen registraties in ${onderdeel.naam} die aan deze filters voldoen.`}
              acties={heeftFilter ? <OutlineKnop href={`/${slug}/log`}>Filter wissen</OutlineKnop> : undefined}
            />
          </div>
        ) : (
          <>
            {/* Mobiel: per dag gegroepeerd, elke groep één kaart */}
            <div className="mt-4 space-y-4 desktop:hidden">
              {[...groepen.entries()].map(([kop, groep]) => (
                <section key={kop}>
                  <h2 className="font-body mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
                    {kop}
                  </h2>
                  <div className="divide-y divide-zand rounded-card border border-border-light bg-creme shadow-[var(--shadow-light)]">
                    {groep.map((regel) => (
                      <Link
                        key={regel.id}
                        href={`/${slug}/materiaal/${encodeURIComponent(regel.materiaal.materiaalId)}`}
                        prefetch={false}
                        className="motion flex items-center justify-between gap-3 p-3.5 hover:bg-zand"
                      >
                        <div className="min-w-0">
                          <p className="flex items-baseline gap-2">
                            <span className="text-[14.5px] font-extrabold text-ink">
                              {regel.materiaal.materiaalId}
                            </span>
                            <span className="text-[11.5px] text-text-muted">
                              {formatTijd(regel.tijdstip)}
                            </span>
                          </p>
                          <p className="truncate text-[13.5px] text-text-medium">{regel.actieNaam}</p>
                          <p className="truncate text-[12px] text-text-muted">
                            {regel.medewerkerNaam}
                          </p>
                        </div>
                        {regel.statusNa && <StatusBadge status={regel.statusNa} />}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Desktop: echte tabel met dagkoppen als tussenrij */}
            <div className="mt-4 hidden overflow-hidden rounded-card border border-border-light bg-creme shadow-[var(--shadow-card)] desktop:block">
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-ink">
                    <Th className="w-[120px]">Materiaal</Th>
                    <Th className="w-[150px]">Categorie</Th>
                    <Th>Actie</Th>
                    <Th className="w-[190px]">Medewerker</Th>
                    <Th className="w-[150px]">Status na actie</Th>
                    <Th className="w-[70px] text-right">Tijd</Th>
                  </tr>
                </thead>
                <tbody>
                  {[...groepen.entries()].map(([kop, groep]) => (
                    <Fragmentje key={kop} kop={kop}>
                      {groep.map((regel) => (
                        <tr key={regel.id} className="motion border-b border-zand last:border-b-0 hover:bg-zand">
                          <Td>
                            <Link
                              href={`/${slug}/materiaal/${encodeURIComponent(regel.materiaal.materiaalId)}`}
                              prefetch={false}
                              className="text-[14.5px] font-extrabold text-ink hover:underline"
                            >
                              {regel.materiaal.materiaalId}
                            </Link>
                          </Td>
                          <Td>
                            <CategorieBadge naam={regel.materiaal.categorie.naam} />
                          </Td>
                          <Td className="text-[13.5px] text-ink">{regel.actieNaam}</Td>
                          <Td className="text-[13px] text-text-medium">{regel.medewerkerNaam}</Td>
                          <Td>{regel.statusNa && <StatusBadge status={regel.statusNa} />}</Td>
                          <Td className="text-right text-[12.5px] text-text-muted">
                            {formatTijd(regel.tijdstip)}
                          </Td>
                        </tr>
                      ))}
                    </Fragmentje>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-[12.5px] text-text-muted">
              {aantal12Maanden} registraties in de laatste 12 maanden.
            </p>
          </>
        )}
      </main>
    </>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-text-muted ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 align-middle ${className}`}>{children}</td>;
}

/** Dagkop als volle-breedte tussenrij, gevolgd door de regels van die dag. */
function Fragmentje({ kop, children }: { kop: string; children: React.ReactNode }) {
  return (
    <>
      <tr>
        <td
          colSpan={6}
          className="border-b border-zand bg-[var(--zand)] px-4 py-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-text-muted"
        >
          {kop}
        </td>
      </tr>
      {children}
    </>
  );
}

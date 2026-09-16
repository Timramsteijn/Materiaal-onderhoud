import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOnderdeel } from "@/lib/onderdeel";
import { isBeheerder } from "@/lib/permissions";
import { formatDatum, formatTijd } from "@/lib/domain";
import { TopBar } from "@/components/top-bar";
import { Kaart, KaartTitel } from "@/components/ui";
import { AfkeuringenKaart } from "./afkeuringen";
import { CategorieBeheer } from "./categorie-beheer";
import { MedewerkerBeheer } from "./medewerker-beheer";
import { ExcelKaart } from "./excel-kaart";

export default async function BeheerPage({
  params,
  searchParams,
}: {
  params: Promise<{ onderdeel: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ onderdeel: slug }, query] = await Promise.all([params, searchParams]);
  const session = await auth();
  const onderdeel = await getOnderdeel(slug);

  // Rolcheck ook hier, niet alleen in de navigatie.
  if (!session?.user || !isBeheerder(session.user.rol)) {
    redirect(`/${slug}/scannen`);
  }

  const [categorieen, medewerkers, afkeuringen, laatsteImport] = await Promise.all([
    prisma.categorie.findMany({
      where: { onderdeelId: onderdeel.id, archivedAt: null },
      orderBy: { sortering: "asc" },
      include: {
        acties: { where: { archivedAt: null }, orderBy: { sortering: "asc" } },
        velden: { where: { archivedAt: null }, orderBy: { sortering: "asc" } },
        _count: { select: { materiaal: true } },
      },
    }),
    prisma.medewerker.findMany({ orderBy: { naam: "asc" } }),
    prisma.materiaal.findMany({
      where: { onderdeelId: onderdeel.id, status: "TER_GOEDKEURING" },
      include: {
        logregels: {
          where: { soort: "AFKEURING_AANGEVRAAGD" },
          orderBy: { tijdstip: "desc" },
          take: 1,
        },
      },
      orderBy: { materiaalId: "asc" },
    }),
    prisma.beheerLog.findFirst({
      where: { wat: "Excel-import" },
      orderBy: { tijdstip: "desc" },
    }),
  ]);

  const importDetail = (laatsteImport?.detail ?? {}) as {
    regels?: number;
    overgeslagen?: number;
  };

  return (
    <>
      <TopBar
        titel="Beheer"
        subregel={`Onderdeel ${onderdeel.naam} · alleen zichtbaar voor beheerders`}
        medewerkerNaam={session.user.naam}
        functie={session.user.functie}
      />

      <main className="flex-1 px-[18px] pb-24 pt-4 desktop:px-6 desktop:pb-8 desktop:pt-5">
        <div className="desktop:hidden">
          <h1 className="display text-[22px] text-ink">Beheer</h1>
          <p className="mb-4 mt-0.5 text-[13px] text-text-muted">
            Alleen zichtbaar voor beheerders.
          </p>
        </div>

        {afkeuringen.length > 0 && (
          <AfkeuringenKaart
            aanvragen={afkeuringen.map((m) => ({
              id: m.id,
              materiaalId: m.materiaalId,
              merkModel: m.merkModel,
              reden: m.logregels[0]?.opmerking ?? "",
              aangevraagdDoor: m.logregels[0]?.medewerkerNaam ?? "onbekend",
              wanneer: m.logregels[0]
                ? `${formatDatum(m.logregels[0].tijdstip)} · ${formatTijd(m.logregels[0].tijdstip)}`
                : "",
            }))}
          />
        )}

        <div className="mt-4 desktop:grid desktop:grid-cols-[1.25fr_1fr] desktop:items-start desktop:gap-4">
          <div className="desktop:col-span-2">
            <ExcelKaart
              slug={slug}
              laatsteImport={
                laatsteImport
                  ? {
                      datum: formatDatum(laatsteImport.tijdstip),
                      regels: importDetail.regels ?? 0,
                      overgeslagen: importDetail.overgeslagen ?? 0,
                    }
                  : null
              }
              melding={query.ok ? "ok" : query.error ? "fout" : null}
              meldingTekst={
                query.error ??
                (query.ok
                  ? `${query.nieuw ?? 0} nieuw, ${query.bijgewerkt ?? 0} bijgewerkt, ${
                      query.overgeslagen ?? 0
                    } overgeslagen`
                  : "")
              }
            />
          </div>

          <div className="mt-3 desktop:mt-0">
            <Kaart>
              <KaartTitel>Onderdeel · {onderdeel.naam}</KaartTitel>
              <p className="mb-3 mt-1 text-[12.5px] text-text-muted">
                Onderhoudsacties en eigen velden staan per categorie.
              </p>
              <CategorieBeheer
                onderdeelId={onderdeel.id}
                medewerkerNaam={session.user.naam}
                categorieen={categorieen.map((c) => ({
                  id: c.id,
                  naam: c.naam,
                  aantal: c._count.materiaal,
                  acties: c.acties.map((a) => ({ id: a.id, naam: a.naam, isAfkeuren: a.isAfkeuren })),
                  velden: c.velden.map((v) => ({ id: v.id, naam: v.naam, eenheid: v.eenheid })),
                }))}
              />
            </Kaart>
          </div>

          <div className="mt-3 desktop:mt-0">
            <MedewerkerBeheer
              slug={slug}
              medewerkerNaam={session.user.naam}
              huidigeId={session.user.id}
              medewerkers={medewerkers.map((m) => ({
                id: m.id,
                naam: m.naam,
                rol: m.rol,
                functie: m.functie,
                actief: m.actief,
              }))}
            />
          </div>
        </div>
      </main>
    </>
  );
}

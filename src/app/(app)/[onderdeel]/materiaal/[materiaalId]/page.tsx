import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOnderdeel } from "@/lib/onderdeel";
import { generateQrDataUrl } from "@/lib/qr";
import { materiaalUrl } from "@/lib/url";
import { formatDatum, formatTijd } from "@/lib/domain";
import { isBeheerder } from "@/lib/permissions";
import { TopBar } from "@/components/top-bar";
import { StatusBadge, CategorieBadge, Kaart, KaartTitel } from "@/components/ui";
import { ChevronLeft, Printer, ScanLine, Plus } from "@/components/icons";
import { Zoekveld } from "../zoekveld";
import { MateriaalLijst } from "../materiaal-lijst";
import { OfflineMelding } from "@/components/offline-melding";
import { RegistratieFormulier } from "./registratie-formulier";
import { MateriaalBewerken } from "./materiaal-bewerken";

export default async function MateriaalKaartjePage({
  params,
  searchParams,
}: {
  params: Promise<{ onderdeel: string; materiaalId: string }>;
  searchParams: Promise<{ q?: string; categorie?: string }>;
}) {
  const [{ onderdeel: slug, materiaalId: ruwId }, filters] = await Promise.all([
    params,
    searchParams,
  ]);
  const materiaalId = decodeURIComponent(ruwId);
  const [session, onderdeel] = await Promise.all([auth(), getOnderdeel(slug)]);

  const materiaal = await prisma.materiaal.findUnique({
    where: { onderdeelId_materiaalId: { onderdeelId: onderdeel.id, materiaalId } },
    include: {
      categorie: {
        include: {
          acties: { where: { archivedAt: null }, orderBy: { sortering: "asc" } },
          velden: { where: { archivedAt: null }, orderBy: { sortering: "asc" } },
        },
      },
      logregels: { orderBy: { tijdstip: "desc" }, take: 3 },
      _count: { select: { logregels: true } },
    },
  });

  // Een materiaal-URL uit een ander onderdeel geeft 404 — geen stille wissel.
  if (!materiaal) notFound();

  const [qrDataUrl, kaartUrl] = await Promise.all([
    materiaalUrl(slug, materiaal.materiaalId).then(generateQrDataUrl),
    materiaalUrl(slug, materiaal.materiaalId),
  ]);
  void kaartUrl;

  const veldwaarden = (materiaal.veldwaarden ?? {}) as Record<string, string>;
  const basis = `/${slug}/materiaal`;

  return (
    <>
      <TopBar medewerkerNaam={session!.user.naam} functie={session!.user.functie}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 max-w-[420px] flex-1">
            <Zoekveld />
          </div>
          <Link
            href={`/${slug}/scannen`}
            prefetch={false}
            className="motion flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed"
          >
            <ScanLine size={16} strokeWidth={2} />
            QR scannen
          </Link>
          <Link
            href={`${basis}/nieuw`}
            prefetch={false}
            className="motion flex h-10 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-ink px-4 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-ink hover:bg-neutral-fill"
          >
            <Plus size={16} strokeWidth={2} />
            Nieuw
          </Link>
        </div>
      </TopBar>

      <main className="flex flex-1 pb-24 desktop:pb-0">
        {/* Masterkolom: op mobiel verborgen — het kaartje is daar een eigen pagina */}
        <div className="hidden desktop:block desktop:w-[392px] desktop:shrink-0 desktop:overflow-y-auto desktop:border-r desktop:border-border-light">
          <MateriaalLijst
            slug={slug}
            onderdeelId={onderdeel.id}
            onderdeelNaam={onderdeel.naam}
            filters={filters}
            actiefId={materiaal.materiaalId}
          />
        </div>

        <div className="min-w-0 flex-1 px-[18px] pt-4 desktop:overflow-y-auto desktop:px-6 desktop:pt-6">
          <Link
            href={basis}
            prefetch={false}
            className="motion mb-3 flex items-center gap-1 text-[13px] font-semibold text-link hover:underline desktop:hidden"
          >
            <ChevronLeft size={16} strokeWidth={2} />
            Terug naar materiaal
          </Link>

          <OfflineMelding />

          {/* Kopkaart */}
          <Kaart className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[26px] font-extrabold leading-tight tracking-[0.02em] text-ink desktop:text-[32px]">
                {materiaal.materiaalId}
              </p>
              <p className="mt-0.5 text-[14px] text-text-medium">{materiaal.merkModel}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <CategorieBadge naam={materiaal.categorie.naam} />
                <StatusBadge status={materiaal.status} />
              </div>
            </div>
            <div className="shrink-0 text-center">
              <div className="flex h-[78px] w-[78px] items-center justify-center rounded-card bg-navy p-1.5 desktop:h-[72px] desktop:w-[72px]">
                <Image
                  src={qrDataUrl}
                  alt={`QR-code voor ${materiaal.materiaalId}`}
                  width={72}
                  height={72}
                  unoptimized
                />
              </div>
              <Link
                href={`${basis}/${encodeURIComponent(materiaal.materiaalId)}/labels`}
                prefetch={false}
                className="motion mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-bold text-link hover:underline"
              >
                <Printer size={13} strokeWidth={2} />
                printen
              </Link>
            </div>
          </Kaart>

          {/* Specificaties: algemeen + de velden van déze categorie */}
          <Kaart className="mt-3 desktop:grid desktop:grid-cols-2 desktop:gap-x-8">
            <div>
              <KaartTitel>Algemeen</KaartTitel>
              <dl className="mt-1">
                <SpecRij label="Categorie" waarde={materiaal.categorie.naam} />
                <SpecRij label="Merk / model" waarde={materiaal.merkModel} />
                <SpecRij label="Locatie" waarde={materiaal.locatie || "—"} />
                <SpecRij label="In gebruik sinds" waarde={formatDatum(materiaal.inGebruikSinds)} />
                <SpecRij
                  label="Laatste groot onderhoud"
                  waarde={
                    materiaal.laatsteOnderhoud ? formatDatum(materiaal.laatsteOnderhoud) : "Nog niet"
                  }
                />
                <SpecRij label="Onderhoudsbeurten" waarde={String(materiaal.aantalBeurten)} />
              </dl>
            </div>

            {materiaal.categorie.velden.length > 0 && (
              <div className="mt-4 desktop:mt-0">
                <h3 className="font-body text-[12px] font-extrabold uppercase tracking-[0.14em] text-link">
                  Velden van categorie {materiaal.categorie.naam}
                </h3>
                <dl className="mt-1">
                  {materiaal.categorie.velden.map((veld) => (
                    <SpecRij
                      key={veld.id}
                      label={veld.naam}
                      waarde={
                        veldwaarden[veld.id]
                          ? `${veldwaarden[veld.id]}${veld.eenheid ? ` ${veld.eenheid}` : ""}`
                          : "—"
                      }
                    />
                  ))}
                </dl>
              </div>
            )}
          </Kaart>

          <div className="mt-3 desktop:flex desktop:items-start desktop:gap-4">
            <RegistratieFormulier
              materiaalDbId={materiaal.id}
              materiaalLabel={materiaal.materiaalId}
              acties={materiaal.categorie.acties.map((a) => ({
                id: a.id,
                naam: a.naam,
                isAfkeuren: a.isAfkeuren,
              }))}
              medewerkerNaam={session!.user.naam}
              nuLabel={`${formatDatum(new Date())} om ${formatTijd(new Date())}`}
            />

            {/* Historie */}
            <Kaart className="mt-3 desktop:mt-0 desktop:w-[300px] desktop:shrink-0">
              <div className="flex items-center justify-between gap-2">
                <KaartTitel>Historie</KaartTitel>
                {materiaal._count.logregels > materiaal.logregels.length && (
                  <Link
                    href={`/${slug}/log?materiaal=${encodeURIComponent(materiaal.materiaalId)}`}
                    prefetch={false}
                    className="text-[11.5px] font-bold text-link hover:underline"
                  >
                    alles zien ({materiaal._count.logregels})
                  </Link>
                )}
              </div>

              {materiaal.logregels.length === 0 ? (
                <p className="mt-2 text-[13px] text-text-muted">Nog geen onderhoud geregistreerd.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {materiaal.logregels.map((log) => (
                    <li key={log.id} className="relative border-l-2 border-border-light pl-3.5">
                      <span className="absolute -left-[5.5px] top-1.5 h-[9px] w-[9px] rounded-full bg-accent" />
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[14px] font-extrabold text-ink">{log.actieNaam}</p>
                        <p className="shrink-0 text-[12px] text-text-muted">
                          {formatDatum(log.tijdstip)}
                        </p>
                      </div>
                      <p className="text-[12.5px] text-text-muted">
                        {log.medewerkerNaam} · {formatTijd(log.tijdstip)}
                      </p>
                      {log.opmerking && (
                        <p className="mt-0.5 text-[13px] text-text-medium">
                          &ldquo;{log.opmerking}&rdquo;
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Kaart>
          </div>

          <div className="mt-3 pb-4">
            <MateriaalBewerken
              materiaal={{
                id: materiaal.id,
                merkModel: materiaal.merkModel,
                locatie: materiaal.locatie,
                inGebruikSinds: materiaal.inGebruikSinds.toISOString().slice(0, 10),
              }}
              velden={materiaal.categorie.velden.map((v) => ({
                id: v.id,
                naam: v.naam,
                eenheid: v.eenheid,
                waarde: veldwaarden[v.id] ?? "",
              }))}
              magVerwijderen={isBeheerder(session!.user.rol)}
            />
          </div>
        </div>
      </main>
    </>
  );
}

function SpecRij({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-zand py-2.5 last:border-b-0">
      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">{label}</dt>
      <dd className="text-right text-[13.5px] text-ink">{waarde}</dd>
    </div>
  );
}

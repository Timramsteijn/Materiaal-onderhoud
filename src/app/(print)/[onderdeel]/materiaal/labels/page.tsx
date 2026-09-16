import { prisma } from "@/lib/prisma";
import { getOnderdeel } from "@/lib/onderdeel";
import { accentStyle } from "@/lib/accent";
import { formatAantal, formatDatum } from "@/lib/domain";
import { PrintKnop } from "../../../print-knop";
import { decodeSegment, getOrigin, materiaalUrl, qrDataUrl } from "../../../label-data";

/** 12 labels per vel, in een raster van 3 × 4. */
const PER_VEL = 12;

/** Bovengrens op één printopdracht: 20 vellen. Daarboven eerst filteren. */
const MAX_LABELS = 20 * PER_VEL;

type Props = {
  params: Promise<{ onderdeel: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function eersteWaarde(waarde: string | string[] | undefined): string | undefined {
  return Array.isArray(waarde) ? waarde[0] : waarde;
}

/** `?ids=SKI-0917,SB-0231` → de geselecteerde Materiaal-ID's, ontdubbeld. */
function leesIds(waarde: string | string[] | undefined): string[] {
  const ruw = Array.isArray(waarde) ? waarde.join(",") : (waarde ?? "");
  const gevonden = ruw
    .split(",")
    .map((deel) => decodeSegment(deel.trim()))
    .filter(Boolean);
  return [...new Set(gevonden)];
}

export default async function PrintvelPagina({ params, searchParams }: Props) {
  const { onderdeel: slug } = await params;
  const query = await searchParams;

  const onderdeel = await getOnderdeel(slug);
  const ids = leesIds(query.ids);
  const categorieId = eersteWaarde(query.categorie);

  // Met een selectie uit de materiaallijst drukken we precies die stuks af;
  // zonder selectie het hele onderdeel, eventueel op één categorie gefilterd.
  const gevonden = await prisma.materiaal.findMany({
    where: {
      onderdeelId: onderdeel.id,
      ...(ids.length > 0
        ? { materiaalId: { in: ids } }
        : categorieId
          ? { categorieId }
          : {}),
    },
    select: { id: true, materiaalId: true, merkModel: true },
    orderBy: { materiaalId: "asc" },
    take: MAX_LABELS + 1,
  });

  const afgekapt = gevonden.length > MAX_LABELS;
  const lijst = afgekapt ? gevonden.slice(0, MAX_LABELS) : gevonden;

  const origin = await getOrigin();
  const labels = await Promise.all(
    lijst.map(async (materiaal) => ({
      id: materiaal.id,
      materiaalId: materiaal.materiaalId,
      merkModel: materiaal.merkModel,
      qr: await qrDataUrl(materiaalUrl(origin, onderdeel.slug, materiaal.materiaalId), 260),
    })),
  );

  const vellen: (typeof labels)[] = [];
  for (let i = 0; i < labels.length; i += PER_VEL) {
    vellen.push(labels.slice(i, i + PER_VEL));
  }

  const datum = formatDatum(new Date());
  const aantalRegel = `${formatAantal(labels.length)} label${labels.length === 1 ? "" : "s"} · ${datum}`;

  return (
    <div style={accentStyle(onderdeel)}>
      <header className="no-print mx-auto flex w-full max-w-[793px] flex-wrap items-end justify-between gap-4 px-[18px] py-6">
        <div>
          <p className="kicker text-[11px] text-text-muted">Printen</p>
          <h1 className="mt-1 text-[22px] text-ink">Printvel A4</h1>
          <p className="mt-1 text-[13px] text-text-muted">
            12 labels per vel (3 × 4) · {aantalRegel} ·{" "}
            {formatAantal(vellen.length)} vel{vellen.length === 1 ? "" : "len"}
          </p>
          <p className="mt-1 text-[12px] text-text-muted">
            Gestippelde lijnen zijn de sniplijnen en worden niet geprint.
          </p>
          {afgekapt && (
            <p className="mt-1 text-[12px] font-bold text-amber-text">
              Er passen maximaal {formatAantal(MAX_LABELS)} labels in één printopdracht. Maak
              een selectie in de materiaallijst of filter op categorie.
            </p>
          )}
        </div>
        {labels.length > 0 && <PrintKnop />}
      </header>

      {labels.length === 0 ? (
        <p className="no-print mx-auto w-full max-w-[793px] px-[18px] pb-12 text-[13px] text-text-muted">
          Geen materiaal gevonden in {onderdeel.naam}. Kies materiaal in de materiaallijst en
          print de selectie opnieuw.
        </p>
      ) : (
        <div className="print-blad">
          {vellen.map((vel, velIndex) => (
            <div key={velIndex} className="vel">
              <div className="vel-kop">
                <div className="vel-kop-titel">Materiaallabels · {onderdeel.naam}</div>
                <div className="vel-kop-meta">{aantalRegel}</div>
              </div>
              <div className="raster">
                {vel.map((label) => (
                  <div key={label.id} className="cel sniplijn">
                    <div className="cel-boven">
                      <div className="qr qr-klein">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={label.qr} alt={`QR-code naar ${label.materiaalId}`} />
                      </div>
                      <div className="cel-tekst">
                        <div className="cel-id">{label.materiaalId}</div>
                        <div className="cel-model">{label.merkModel}</div>
                      </div>
                    </div>
                    <div className="cel-voet">Outdoor Valley · {onderdeel.naam}</div>
                  </div>
                ))}
                {/* Lege cellen houden het snijraster op het laatste vel heel. */}
                {Array.from({ length: PER_VEL - vel.length }).map((_, i) => (
                  <div key={`leeg-${i}`} className="cel sniplijn" aria-hidden="true" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

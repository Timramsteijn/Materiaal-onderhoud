import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOnderdeel } from "@/lib/onderdeel";
import { accentStyle } from "@/lib/accent";
import { PrintKnop } from "../../../../print-knop";
import {
  decodeSegment,
  getOrigin,
  materiaalUrl,
  qrDataUrl,
  veldwaardenVan,
} from "../../../../label-data";

/** Veldnamen die als maatregel onder merk/model komen te staan. */
const MAAT_VELDEN = ["lengte", "maat"];

type Props = {
  params: Promise<{ onderdeel: string; materiaalId: string }>;
};

export default async function LosLabelPagina({ params }: Props) {
  const { onderdeel: slug, materiaalId: ruwId } = await params;
  const materiaalId = decodeSegment(ruwId);

  const onderdeel = await getOnderdeel(slug);
  const materiaal = await prisma.materiaal.findUnique({
    where: { onderdeelId_materiaalId: { onderdeelId: onderdeel.id, materiaalId } },
    include: {
      categorie: {
        include: {
          velden: { where: { archivedAt: null }, orderBy: { sortering: "asc" } },
        },
      },
    },
  });
  if (!materiaal) notFound();

  // Maat komt uit de categorie-eigen velden, niet uit een vaste kolom: een
  // nieuw onderdeel hoeft daarvoor geen code te krijgen.
  const waarden = veldwaardenVan(materiaal.veldwaarden);
  const maatVeld = materiaal.categorie.velden.find(
    (veld) => MAAT_VELDEN.includes(veld.naam.toLowerCase()) && waarden[veld.id],
  );
  const maat = maatVeld
    ? [waarden[maatVeld.id], maatVeld.eenheid].filter(Boolean).join(" ")
    : null;

  const origin = await getOrigin();
  const kaartjeUrl = materiaalUrl(origin, onderdeel.slug, materiaal.materiaalId);
  const qr = await qrDataUrl(kaartjeUrl, 360);

  return (
    <div style={accentStyle(onderdeel)}>
      <header className="no-print mx-auto flex w-full max-w-[793px] flex-wrap items-end justify-between gap-4 px-[18px] py-6">
        <div>
          <p className="kicker text-[11px] text-text-muted">Printen</p>
          <h1 className="mt-1 text-[22px] text-ink">Los label</h1>
          <p className="mt-1 text-[13px] text-text-muted">
            70 × 44 mm · {materiaal.materiaalId} · {onderdeel.naam}
          </p>
          <p className="mt-1 text-[12px] text-text-muted">
            Gestippelde lijn is de sniplijn en wordt niet geprint.
          </p>
        </div>
        <PrintKnop />
      </header>

      <div className="print-blad">
        <div className="vel">
          <div className="label sniplijn">
            <div className="qr qr-groot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={`QR-code naar ${materiaal.materiaalId}`} />
            </div>
            <div className="label-tekst">
              <div className="label-kicker">Outdoor Valley</div>
              <div className="label-id">{materiaal.materiaalId}</div>
              <div className="label-model">
                {materiaal.merkModel}
                {maat && (
                  <>
                    <br />
                    {maat}
                  </>
                )}
              </div>
              <div className="label-onderdeel">{onderdeel.naam}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

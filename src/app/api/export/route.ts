import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildExportWorkbook,
  leesVeldwaarden,
  type ExportLogRegel,
  type ExportMateriaal,
  type ExportVeld,
} from "@/lib/excel";

/**
 * GET /api/export            → alles
 * GET /api/export?onderdeel= → alleen dat onderdeel (slug)
 *
 * De export volgt de scope van het scherm waar hij vandaan komt, zodat een
 * beheerder van Ski & Snowboard geen fietsen meekrijgt.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Niet ingelogd.", { status: 401 });
  }

  const slug = new URL(request.url).searchParams.get("onderdeel")?.trim() ?? "";
  const onderdeel = slug ? await prisma.onderdeel.findUnique({ where: { slug } }) : null;
  if (slug && !onderdeel) {
    return new Response("Onbekend onderdeel.", { status: 404 });
  }

  const materiaalFilter = onderdeel ? { onderdeelId: onderdeel.id } : {};

  const [materiaal, logs] = await Promise.all([
    prisma.materiaal.findMany({
      where: materiaalFilter,
      include: {
        onderdeel: { select: { naam: true, sortering: true } },
        categorie: { select: { naam: true } },
      },
      orderBy: [{ onderdeel: { sortering: "asc" } }, { materiaalId: "asc" }],
    }),
    prisma.logRegel.findMany({
      where: onderdeel ? { materiaal: { onderdeelId: onderdeel.id } } : {},
      include: {
        materiaal: {
          select: {
            materiaalId: true,
            onderdeel: { select: { naam: true } },
            categorie: { select: { naam: true } },
          },
        },
      },
      orderBy: { tijdstip: "asc" },
    }),
  ]);

  // Alleen de velddefinities van de categorieën die in deze export voorkomen.
  const categorieIds = [...new Set(materiaal.map((m) => m.categorieId))];
  const velddefinities = categorieIds.length
    ? await prisma.veldDefinitie.findMany({
        where: { categorieId: { in: categorieIds } },
        include: { categorie: { select: { naam: true, sortering: true } } },
        orderBy: [{ categorie: { sortering: "asc" } }, { sortering: "asc" }],
      })
    : [];

  const materialen: ExportMateriaal[] = materiaal.map((m) => ({
    materiaalId: m.materiaalId,
    onderdeelNaam: m.onderdeel.naam,
    categorieNaam: m.categorie.naam,
    merkModel: m.merkModel,
    locatie: m.locatie,
    status: m.status,
    inGebruikSinds: m.inGebruikSinds,
    laatsteOnderhoud: m.laatsteOnderhoud,
    aantalBeurten: m.aantalBeurten,
    veldwaarden: leesVeldwaarden(m.veldwaarden),
  }));

  // Gearchiveerde velden krijgen alleen een kolom als er nog waarden in staan.
  const gevuldeVeldIds = new Set(
    materialen.flatMap((m) =>
      Object.entries(m.veldwaarden)
        .filter(([, waarde]) => waarde !== "")
        .map(([id]) => id)
    )
  );
  const velden: ExportVeld[] = velddefinities
    .filter((v) => v.archivedAt === null || gevuldeVeldIds.has(v.id))
    .map((v) => ({ id: v.id, naam: v.naam, categorieNaam: v.categorie.naam }));

  const logRegels: ExportLogRegel[] = logs.map((l) => ({
    tijdstip: l.tijdstip,
    materiaalId: l.materiaal.materiaalId,
    onderdeelNaam: l.materiaal.onderdeel.naam,
    categorieNaam: l.materiaal.categorie.naam,
    actieNaam: l.actieNaam,
    medewerkerNaam: l.medewerkerNaam,
    statusNa: l.statusNa,
    opmerking: l.opmerking,
  }));

  const buffer = buildExportWorkbook({ materialen, velden, logs: logRegels });

  const datum = new Date().toISOString().slice(0, 10);
  const bestandsnaam = `Onderhoud_${bestandsnaamDeel(onderdeel?.naam ?? "Alles")}_${datum}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${bestandsnaam}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** "Ski & Snowboard" → "Ski_Snowboard": veilig in een Content-Disposition. */
function bestandsnaamDeel(naam: string): string {
  const schoon = naam
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return schoon || "Alles";
}

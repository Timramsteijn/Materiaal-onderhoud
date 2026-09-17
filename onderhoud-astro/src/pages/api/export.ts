import type { APIRoute } from "astro";
import { asc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/context";
import {
  categorieen,
  logregels,
  materiaal,
  onderdelen,
  velddefinities,
} from "@/db/schema";
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
export const GET: APIRoute = async ({ url, locals }) => {
  if (!locals.medewerker) return new Response("Niet ingelogd.", { status: 401 });

  const slug = url.searchParams.get("onderdeel")?.trim() ?? "";
  const onderdeel = slug
    ? await db().query.onderdelen.findFirst({ where: eq(onderdelen.slug, slug) })
    : null;
  if (slug && !onderdeel) return new Response("Onbekend onderdeel.", { status: 404 });

  const stukkenQuery = db()
    .select({
      id: materiaal.id,
      materiaalId: materiaal.materiaalId,
      categorieId: materiaal.categorieId,
      merkModel: materiaal.merkModel,
      locatie: materiaal.locatie,
      status: materiaal.status,
      inGebruikSinds: materiaal.inGebruikSinds,
      laatsteOnderhoud: materiaal.laatsteOnderhoud,
      aantalBeurten: materiaal.aantalBeurten,
      veldwaarden: materiaal.veldwaarden,
      onderdeelNaam: onderdelen.naam,
      onderdeelSortering: onderdelen.sortering,
      categorieNaam: categorieen.naam,
    })
    .from(materiaal)
    .innerJoin(onderdelen, eq(onderdelen.id, materiaal.onderdeelId))
    .innerJoin(categorieen, eq(categorieen.id, materiaal.categorieId))
    .orderBy(asc(onderdelen.sortering), asc(materiaal.materiaalId));

  const logQuery = db()
    .select({
      tijdstip: logregels.tijdstip,
      actieNaam: logregels.actieNaam,
      medewerkerNaam: logregels.medewerkerNaam,
      statusNa: logregels.statusNa,
      opmerking: logregels.opmerking,
      materiaalId: materiaal.materiaalId,
      onderdeelNaam: onderdelen.naam,
      categorieNaam: categorieen.naam,
    })
    .from(logregels)
    .innerJoin(materiaal, eq(materiaal.id, logregels.materiaalDbId))
    .innerJoin(onderdelen, eq(onderdelen.id, materiaal.onderdeelId))
    .innerJoin(categorieen, eq(categorieen.id, materiaal.categorieId))
    .orderBy(asc(logregels.tijdstip));

  const [stukken, logs] = await Promise.all([
    onderdeel ? stukkenQuery.where(eq(materiaal.onderdeelId, onderdeel.id)) : stukkenQuery,
    onderdeel ? logQuery.where(eq(materiaal.onderdeelId, onderdeel.id)) : logQuery,
  ]);

  // Alleen de velddefinities van de categorieën die in deze export voorkomen.
  const categorieIds = [...new Set(stukken.map((m) => m.categorieId))];
  const definities = categorieIds.length
    ? await db()
        .select({
          id: velddefinities.id,
          naam: velddefinities.naam,
          archivedAt: velddefinities.archivedAt,
          categorieNaam: categorieen.naam,
          categorieSortering: categorieen.sortering,
          veldSortering: velddefinities.sortering,
        })
        .from(velddefinities)
        .innerJoin(categorieen, eq(categorieen.id, velddefinities.categorieId))
        .where(inArray(velddefinities.categorieId, categorieIds))
        .orderBy(asc(categorieen.sortering), asc(velddefinities.sortering))
    : [];

  const materialen: ExportMateriaal[] = stukken.map((m) => ({
    materiaalId: m.materiaalId,
    onderdeelNaam: m.onderdeelNaam,
    categorieNaam: m.categorieNaam,
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
  const velden: ExportVeld[] = definities
    .filter((v) => v.archivedAt === null || gevuldeVeldIds.has(v.id))
    .map((v) => ({ id: v.id, naam: v.naam, categorieNaam: v.categorieNaam }));

  const logRegels: ExportLogRegel[] = logs.map((l) => ({
    tijdstip: l.tijdstip,
    materiaalId: l.materiaalId,
    onderdeelNaam: l.onderdeelNaam,
    categorieNaam: l.categorieNaam,
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
};

/** "Ski & Snowboard" → "Ski_Snowboard": veilig in een Content-Disposition. */
function bestandsnaamDeel(naam: string): string {
  const schoon = naam
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return schoon || "Alles";
}

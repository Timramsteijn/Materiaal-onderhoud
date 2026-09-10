import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDutyManager } from "@/lib/permissions";
import { parseImportWorkbook } from "@/lib/excel";

const MAX_BESTANDSGROOTTE = 5 * 1024 * 1024; // 5 MB — ruim genoeg voor een inventarisatielijst

export async function POST(request: Request) {
  const redirectMet = (params: Record<string, string>) => redirectNaarBeheer(request, params);

  const session = await auth();
  if (!session?.user) {
    return redirectMet({ error: "Niet ingelogd." });
  }
  if (!isDutyManager(session.user.role)) {
    return redirectMet({ error: "Alleen duty managers mogen bulk importeren." });
  }

  const formData = await request.formData();
  const bestand = formData.get("bestand");
  if (!(bestand instanceof File) || bestand.size === 0) {
    return redirectMet({ error: "Geen bestand geselecteerd." });
  }
  if (bestand.size > MAX_BESTANDSGROOTTE) {
    return redirectMet({ error: "Bestand is te groot (max 5 MB)." });
  }

  let parsed;
  try {
    parsed = parseImportWorkbook(await bestand.arrayBuffer());
  } catch {
    return redirectMet({
      error: 'Kon dit bestand niet lezen. Controleer of het een geldig Excel-bestand is.',
    });
  }
  if (!parsed.materiaalSheetGevonden) {
    return redirectMet({ error: 'Kon geen tabblad "Materiaal" met kolom "Materiaal-ID" vinden.' });
  }

  const categories = await prisma.category.findMany();
  const categorieByNaam = new Map(categories.map((c) => [c.naam.toLowerCase(), c]));

  let materiaalToegevoegd = 0;
  let materiaalBijgewerkt = 0;
  let materiaalOvergeslagen = 0;

  for (const rij of parsed.materialen) {
    const categorie = categorieByNaam.get(rij.categorieNaam.trim().toLowerCase());
    if (!categorie) {
      materiaalOvergeslagen++;
      continue;
    }

    const bestaat = await prisma.material.findUnique({ where: { id: rij.id } });
    const data = {
      categoryId: categorie.id,
      merk: rij.merk,
      model: rij.model,
      maat: rij.maat || null,
      aanschafjaar: rij.aanschafjaar ? parseInt(rij.aanschafjaar, 10) || null : null,
      status: rij.status,
      opmerkingen: rij.opmerkingen || null,
    };

    if (bestaat) {
      await prisma.material.update({ where: { id: rij.id }, data });
      materiaalBijgewerkt++;
    } else {
      await prisma.material.create({ data: { id: rij.id, ...data } });
      materiaalToegevoegd++;
    }
  }

  let logToegevoegd = 0;
  let logOvergeslagen = 0;

  if (parsed.logs.length > 0) {
    const materialIds = Array.from(new Set(parsed.logs.map((l) => l.materialId)));
    const [bekendeMaterialen, gebruikers, bestaandeLogs] = await Promise.all([
      prisma.material.findMany({
        where: { id: { in: materialIds } },
        select: { id: true, categoryId: true },
      }),
      prisma.user.findMany({ select: { id: true, naam: true } }),
      prisma.maintenanceLog.findMany({
        where: { materialId: { in: materialIds } },
        select: { materialId: true, actie: true, datum: true, opmerkingen: true },
      }),
    ]);

    const materiaalIds = new Set(bekendeMaterialen.map((m) => m.id));
    const gebruikerByNaam = new Map(gebruikers.map((u) => [u.naam.toLowerCase(), u]));
    const bestaandeSignaturen = new Set(
      bestaandeLogs.map(
        (l) => `${l.materialId}|${l.actie.toLowerCase()}|${l.datum.toISOString().slice(0, 10)}`
      )
    );

    for (const rij of parsed.logs) {
      if (!materiaalIds.has(rij.materialId)) {
        logOvergeslagen++;
        continue;
      }
      const dagSignatuur = `${rij.materialId}|${rij.actie.toLowerCase()}|${rij.datumIso.slice(0, 10)}`;
      if (bestaandeSignaturen.has(dagSignatuur)) {
        logOvergeslagen++;
        continue;
      }

      const gekoppeldeGebruiker = rij.door ? gebruikerByNaam.get(rij.door.toLowerCase()) : undefined;
      const opmerkingen = gekoppeldeGebruiker
        ? rij.opmerkingen || null
        : [
            rij.door ? `Geïmporteerd, oorspronkelijk uitgevoerd door: ${rij.door}.` : "Geïmporteerd.",
            rij.opmerkingen,
          ]
            .filter(Boolean)
            .join(" ");

      await prisma.maintenanceLog.create({
        data: {
          materialId: rij.materialId,
          actie: rij.actie,
          datum: new Date(rij.datumIso),
          opmerkingen,
          uitgevoerdDoorId: gekoppeldeGebruiker?.id ?? session.user.id,
        },
      });
      bestaandeSignaturen.add(dagSignatuur);
      logToegevoegd++;
    }
  }

  return redirectMet({
    ok: "1",
    matToegevoegd: String(materiaalToegevoegd),
    matBijgewerkt: String(materiaalBijgewerkt),
    matOvergeslagen: String(materiaalOvergeslagen),
    logToegevoegd: String(logToegevoegd),
    logOvergeslagen: String(logOvergeslagen),
  });
}

function redirectNaarBeheer(request: Request, params: Record<string, string>): Response {
  const qs = new URLSearchParams(params).toString();
  return Response.redirect(new URL(`/beheer?${qs}`, request.url), 303);
}

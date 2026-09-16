import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ActionError, requireBeheerder } from "@/lib/actions/guard";
import {
  leesDatum,
  leesStatus,
  leesVeldwaarden,
  parseImportWorkbook,
  veldKolomSleutels,
} from "@/lib/excel";
import type { Status } from "@prisma/client";

const MAX_BESTANDSGROOTTE = 5 * 1024 * 1024; // 5 MB — ruim genoeg voor een inventarisatielijst
/** De overgeslagen regels gaan mee in de URL; die moet wel hanteerbaar blijven. */
const MAX_DETAIL_TEKENS = 700;

/**
 * POST /api/import  (multipart, veld "bestand")
 *
 * Alleen beheerders. Het onderdeel komt uit de querystring of het formulierveld
 * "onderdeel" (slug) en kan per regel overschreven worden met de kolom
 * "Onderdeel". Elke regel wordt apart gevalideerd: een fout in regel 14 laat de
 * rest van het bestand gewoon doorlopen.
 */
export async function POST(request: Request) {
  const querySlug = new URL(request.url).searchParams.get("onderdeel")?.trim() ?? "";

  let beheerder;
  try {
    beheerder = await requireBeheerder();
  } catch (fout) {
    const melding =
      fout instanceof ActionError ? fout.message : "Alleen beheerders mogen importeren.";
    if (!querySlug) return new Response(melding, { status: 403 });
    return redirectNaarBeheer(request, querySlug, { error: melding });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return redirectNaarBeheer(request, querySlug, { error: "Kon het formulier niet lezen." });
  }

  const slug = String(formData.get("onderdeel") ?? "").trim() || querySlug;

  const bestand = formData.get("bestand");
  if (!(bestand instanceof File) || bestand.size === 0) {
    return redirectNaarBeheer(request, slug, { error: "Geen bestand geselecteerd." });
  }
  if (bestand.size > MAX_BESTANDSGROOTTE) {
    return redirectNaarBeheer(request, slug, { error: "Bestand is te groot (max 5 MB)." });
  }

  let werkboek;
  try {
    werkboek = parseImportWorkbook(await bestand.arrayBuffer());
  } catch {
    return redirectNaarBeheer(request, slug, {
      error: "Kon dit bestand niet lezen. Controleer of het een geldig Excel-bestand is.",
    });
  }
  if (!werkboek.materiaalBladGevonden) {
    return redirectNaarBeheer(request, slug, {
      error: 'Kon geen tabblad "Materiaal" met een kolom "Materiaal-ID" vinden.',
    });
  }

  const onderdelen = await prisma.onderdeel.findMany({
    include: { categorieen: { include: { velden: true } } },
  });
  const onderdeelByNaam = new Map(onderdelen.map((o) => [o.naam.trim().toLowerCase(), o]));
  const standaardOnderdeel = slug ? onderdelen.find((o) => o.slug === slug) : undefined;
  if (slug && !standaardOnderdeel) {
    return redirectNaarBeheer(request, "", { error: "Onbekend onderdeel." });
  }

  type OnderdeelMetConfig = (typeof onderdelen)[number];
  /** Categorieën per onderdeel op naam; een actieve categorie wint van een gearchiveerde. */
  const categorieIndex = new Map<string, Map<string, OnderdeelMetConfig["categorieen"][number]>>();
  for (const onderdeel of onderdelen) {
    const perNaam = new Map<string, OnderdeelMetConfig["categorieen"][number]>();
    for (const categorie of onderdeel.categorieen) {
      const sleutel = categorie.naam.trim().toLowerCase();
      const bestaand = perNaam.get(sleutel);
      if (!bestaand || (bestaand.archivedAt && !categorie.archivedAt)) {
        perNaam.set(sleutel, categorie);
      }
    }
    categorieIndex.set(onderdeel.id, perNaam);
  }

  /** Overgeslagen regels mét reden; gaat afgekapt mee terug in de querystring. */
  const overgeslagen: string[] = [];
  const geraakteSlugs = new Set<string>();
  /** `${onderdeelId}|${materiaalId}` → database-id, ook voor de logregels. */
  const materiaalIndex = new Map<string, string>();
  let toegevoegd = 0;
  let bijgewerkt = 0;
  let matOvergeslagen = 0;

  for (const rij of werkboek.materiaalRijen) {
    const meld = (reden: string) => {
      matOvergeslagen++;
      overgeslagen.push(`regel ${rij.rijnummer}: ${reden}`);
    };

    if (!rij.materiaalId) {
      meld("geen Materiaal-ID");
      continue;
    }

    const onderdeel = rij.onderdeelNaam
      ? onderdeelByNaam.get(rij.onderdeelNaam.trim().toLowerCase())
      : standaardOnderdeel;
    if (!onderdeel) {
      meld(
        rij.onderdeelNaam
          ? `onbekend onderdeel "${rij.onderdeelNaam}"`
          : "geen onderdeel bekend (vul de kolom Onderdeel of importeer vanuit een onderdeel)"
      );
      continue;
    }

    const sleutel = `${onderdeel.id}|${rij.materiaalId}`;
    // Per regel opzoeken: zo pikt een tweede regel met hetzelfde ID de zojuist
    // aangemaakte rij gewoon op.
    const bestaand = await prisma.materiaal.findUnique({
      where: {
        onderdeelId_materiaalId: { onderdeelId: onderdeel.id, materiaalId: rij.materiaalId },
      },
      select: { id: true, categorieId: true, veldwaarden: true },
    });

    const perNaam = categorieIndex.get(onderdeel.id);
    const categorie = rij.categorieNaam
      ? perNaam?.get(rij.categorieNaam.trim().toLowerCase())
      : bestaand
        ? onderdeel.categorieen.find((c) => c.id === bestaand.categorieId)
        : undefined;
    if (!categorie) {
      meld(
        rij.categorieNaam
          ? `onbekende categorie "${rij.categorieNaam}" in ${onderdeel.naam}`
          : "categorie ontbreekt"
      );
      continue;
    }

    let status: Status | null = null;
    if (rij.statusRuw) {
      status = leesStatus(rij.statusRuw);
      if (!status) {
        meld(`onbekende status "${rij.statusRuw}"`);
        continue;
      }
    }

    let inGebruikSinds: Date | null = null;
    if (!isLeeg(rij.inGebruikSindsRuw)) {
      inGebruikSinds = leesDatum(rij.inGebruikSindsRuw);
      if (!inGebruikSinds) {
        meld(`ongeldige datum in "In gebruik sinds"`);
        continue;
      }
    }

    if (!bestaand && !rij.merkModel) {
      meld("merk/model ontbreekt voor nieuw materiaal");
      continue;
    }

    // Bij een categoriewissel blijven alleen de waarden van de nieuwe categorie staan.
    const veldIds = new Set(categorie.velden.map((v) => v.id));
    const veldwaarden: Record<string, string> = {};
    if (bestaand) {
      for (const [id, waarde] of Object.entries(leesVeldwaarden(bestaand.veldwaarden))) {
        if (veldIds.has(id)) veldwaarden[id] = waarde;
      }
    }
    for (const veld of categorie.velden) {
      for (const kolom of veldKolomSleutels(categorie.naam, veld.naam)) {
        const waarde = rij.veldkolommen[kolom];
        if (waarde) {
          veldwaarden[veld.id] = waarde;
          break;
        }
      }
    }

    if (bestaand) {
      await prisma.materiaal.update({
        where: { id: bestaand.id },
        data: {
          categorieId: categorie.id,
          // Lege cellen laten de huidige waarde staan; leegmaken doe je in de app.
          ...(rij.merkModel ? { merkModel: rij.merkModel } : {}),
          ...(rij.locatie ? { locatie: rij.locatie } : {}),
          ...(status ? { status } : {}),
          ...(status && status !== "TER_GOEDKEURING" ? { statusVoorKeuring: null } : {}),
          ...(inGebruikSinds ? { inGebruikSinds } : {}),
          veldwaarden,
        },
      });
      materiaalIndex.set(sleutel, bestaand.id);
      bijgewerkt++;
    } else {
      const nieuw = await prisma.materiaal.create({
        data: {
          materiaalId: rij.materiaalId,
          onderdeelId: onderdeel.id,
          categorieId: categorie.id,
          merkModel: rij.merkModel,
          locatie: rij.locatie,
          status: status ?? "IN_GEBRUIK",
          inGebruikSinds: inGebruikSinds ?? new Date(),
          veldwaarden,
        },
        select: { id: true },
      });
      materiaalIndex.set(sleutel, nieuw.id);
      toegevoegd++;
    }
    geraakteSlugs.add(onderdeel.slug);
  }

  /* ---------- optioneel tabblad "Onderhoudslog" ---------- */

  let logToegevoegd = 0;
  let logOvergeslagen = 0;

  if (werkboek.logRijen.length > 0) {
    const medewerkers = await prisma.medewerker.findMany({ select: { id: true, naam: true } });
    const medewerkerByNaam = new Map(medewerkers.map((m) => [m.naam.trim().toLowerCase(), m]));

    type NieuweLogRegel = {
      materiaalDbId: string;
      actieNaam: string;
      opmerking: string;
      statusNa: Status | null;
      medewerkerId: string;
      medewerkerNaam: string;
      tijdstip: Date;
      clientId: string;
    };
    const teMaken: NieuweLogRegel[] = [];
    const gezieneClientIds = new Set<string>();

    for (const rij of werkboek.logRijen) {
      const meld = (reden: string) => {
        logOvergeslagen++;
        overgeslagen.push(`onderhoudslog regel ${rij.rijnummer}: ${reden}`);
      };

      if (!rij.materiaalId || !rij.actie) {
        meld("materiaal-ID of actie ontbreekt");
        continue;
      }
      const onderdeel = rij.onderdeelNaam
        ? onderdeelByNaam.get(rij.onderdeelNaam.trim().toLowerCase())
        : standaardOnderdeel;
      if (!onderdeel) {
        meld(rij.onderdeelNaam ? `onbekend onderdeel "${rij.onderdeelNaam}"` : "geen onderdeel bekend");
        continue;
      }
      if (!rij.tijdstip) {
        meld("ongeldige of ontbrekende datum");
        continue;
      }

      const sleutel = `${onderdeel.id}|${rij.materiaalId}`;
      let materiaalDbId = materiaalIndex.get(sleutel);
      if (!materiaalDbId) {
        const gevonden = await prisma.materiaal.findUnique({
          where: {
            onderdeelId_materiaalId: { onderdeelId: onderdeel.id, materiaalId: rij.materiaalId },
          },
          select: { id: true },
        });
        if (!gevonden) {
          meld(`onbekend materiaal "${rij.materiaalId}" in ${onderdeel.naam}`);
          continue;
        }
        materiaalDbId = gevonden.id;
        materiaalIndex.set(sleutel, materiaalDbId);
      }

      // Onbekende medewerker is geen fout: de naam blijft als tekstkopie staan.
      const medewerker = medewerkerByNaam.get(rij.medewerkerNaam.trim().toLowerCase());

      // Deterministisch, zodat hetzelfde bestand twee keer importeren niets dupliceert.
      const clientId = `import:${onderdeel.slug}:${rij.materiaalId}:${rij.tijdstip.toISOString()}:${rij.actie.slice(0, 60)}`;
      if (gezieneClientIds.has(clientId)) {
        logOvergeslagen++;
        continue;
      }
      gezieneClientIds.add(clientId);

      teMaken.push({
        materiaalDbId,
        actieNaam: rij.actie,
        opmerking: rij.opmerking,
        statusNa: leesStatus(rij.statusNaRuw),
        medewerkerId: medewerker?.id ?? beheerder.id,
        medewerkerNaam: rij.medewerkerNaam || medewerker?.naam || beheerder.naam,
        tijdstip: rij.tijdstip,
        clientId,
      });
      geraakteSlugs.add(onderdeel.slug);
    }

    if (teMaken.length > 0) {
      // skipDuplicates vangt de regels die al eerder geïmporteerd zijn (clientId is uniek).
      const resultaat = await prisma.logRegel.createMany({
        data: teMaken.map((l) => ({ ...l, soort: "REGISTRATIE" as const })),
        skipDuplicates: true,
      });
      logToegevoegd = resultaat.count;
      logOvergeslagen += teMaken.length - resultaat.count;
    }
  }

  await prisma.beheerLog.create({
    data: {
      medewerkerId: beheerder.id,
      wat: "Excel-import",
      detail: {
        bestand: bestand.name,
        onderdeel: standaardOnderdeel?.slug ?? "alles",
        // "regels" en "overgeslagen" leest de beheerpagina uit als samenvatting.
        regels: toegevoegd + bijgewerkt,
        overgeslagen: matOvergeslagen,
        nieuw: toegevoegd,
        bijgewerkt,
        logToegevoegd,
      },
    },
  });

  for (const geraakt of geraakteSlugs) {
    revalidatePath(`/${geraakt}/materiaal`);
    revalidatePath(`/${geraakt}/overzicht`);
    revalidatePath(`/${geraakt}/log`);
    revalidatePath(`/${geraakt}/beheer`);
  }

  // Parameternamen zoals de beheerpagina ze uitleest: ok / nieuw / bijgewerkt /
  // overgeslagen, aangevuld met de logtellers en de reden per overgeslagen regel.
  const doelSlug = standaardOnderdeel?.slug ?? [...geraakteSlugs][0] ?? "";
  return redirectNaarBeheer(request, doelSlug, {
    ok: "1",
    nieuw: String(toegevoegd),
    bijgewerkt: String(bijgewerkt),
    overgeslagen: String(matOvergeslagen),
    logToegevoegd: String(logToegevoegd),
    logOvergeslagen: String(logOvergeslagen),
    ...(overgeslagen.length > 0 ? { overgeslagenDetail: kortDetail(overgeslagen) } : {}),
  });
}

function isLeeg(waarde: unknown): boolean {
  if (waarde instanceof Date) return false;
  return String(waarde ?? "").trim() === "";
}

/** Houdt de querystring hanteerbaar: de rest wordt als aantal samengevat. */
function kortDetail(regels: string[]): string {
  const meegenomen: string[] = [];
  let lengte = 0;
  for (const regel of regels) {
    if (lengte + regel.length > MAX_DETAIL_TEKENS) break;
    meegenomen.push(regel);
    lengte += regel.length + 3;
  }
  const rest = regels.length - meegenomen.length;
  const tekst = meegenomen.join(" | ");
  if (rest === 0) return tekst;
  return tekst ? `${tekst} | … (+${rest} meer)` : `${rest} regels overgeslagen`;
}

/** Zonder bekend onderdeel is er geen beheerpagina: dan terug naar de keuzelijst. */
function redirectNaarBeheer(
  request: Request,
  slug: string,
  params: Record<string, string>
): Response {
  const qs = new URLSearchParams(params).toString();
  const pad = slug ? `/${encodeURIComponent(slug)}/beheer` : "/onderdeel";
  return Response.redirect(new URL(`${pad}?${qs}`, request.url), 303);
}

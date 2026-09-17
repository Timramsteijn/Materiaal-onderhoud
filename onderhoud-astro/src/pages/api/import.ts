import type { APIRoute } from "astro";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/context";
import { isBeheerder } from "@/lib/permissies";
import { nieuwId } from "@/lib/id";
import {
  beheerlog,
  categorieen,
  logregels,
  materiaal,
  medewerkers,
  onderdelen,
  velddefinities,
  type Status,
} from "@/db/schema";
import {
  leesDatum,
  leesStatus,
  leesVeldwaarden,
  parseImportWorkbook,
  veldKolomSleutels,
} from "@/lib/excel";

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
export const POST: APIRoute = async ({ request, url, locals }) => {
  const querySlug = url.searchParams.get("onderdeel")?.trim() ?? "";

  const beheerder = locals.medewerker;
  if (!beheerder || !isBeheerder(beheerder.rol)) {
    const melding = "Alleen beheerders mogen importeren.";
    if (!querySlug) return new Response(melding, { status: 403 });
    return terugNaarBeheer(url, querySlug, { error: melding });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return terugNaarBeheer(url, querySlug, { error: "Kon het formulier niet lezen." });
  }

  const slug = String(formData.get("onderdeel") ?? "").trim() || querySlug;

  const bestand = formData.get("bestand");
  if (!(bestand instanceof File) || bestand.size === 0) {
    return terugNaarBeheer(url, slug, { error: "Geen bestand geselecteerd." });
  }
  if (bestand.size > MAX_BESTANDSGROOTTE) {
    return terugNaarBeheer(url, slug, { error: "Bestand is te groot (max 5 MB)." });
  }

  let werkboek;
  try {
    werkboek = parseImportWorkbook(await bestand.arrayBuffer());
  } catch {
    return terugNaarBeheer(url, slug, {
      error: "Kon dit bestand niet lezen. Controleer of het een geldig Excel-bestand is.",
    });
  }
  if (!werkboek.materiaalBladGevonden) {
    return terugNaarBeheer(url, slug, {
      error: 'Kon geen tabblad "Materiaal" met een kolom "Materiaal-ID" vinden.',
    });
  }

  const [alleOnderdelen, alleCategorieen, alleVelden] = await Promise.all([
    db().select().from(onderdelen),
    db().select().from(categorieen),
    db().select().from(velddefinities),
  ]);

  const onderdeelByNaam = new Map(alleOnderdelen.map((o) => [o.naam.trim().toLowerCase(), o]));
  const standaardOnderdeel = slug ? alleOnderdelen.find((o) => o.slug === slug) : undefined;
  if (slug && !standaardOnderdeel) {
    return terugNaarBeheer(url, "", { error: "Onbekend onderdeel." });
  }

  const veldenPerCategorie = new Map<string, typeof alleVelden>();
  for (const veld of alleVelden) {
    const lijst = veldenPerCategorie.get(veld.categorieId) ?? [];
    lijst.push(veld);
    veldenPerCategorie.set(veld.categorieId, lijst);
  }

  /** Categorieën per onderdeel op naam; een actieve categorie wint van een gearchiveerde. */
  const categorieIndex = new Map<string, Map<string, (typeof alleCategorieen)[number]>>();
  const categorieById = new Map(alleCategorieen.map((c) => [c.id, c]));
  for (const categorie of alleCategorieen) {
    const perNaam = categorieIndex.get(categorie.onderdeelId) ?? new Map();
    const sleutel = categorie.naam.trim().toLowerCase();
    const bestaand = perNaam.get(sleutel);
    if (!bestaand || (bestaand.archivedAt && !categorie.archivedAt)) {
      perNaam.set(sleutel, categorie);
    }
    categorieIndex.set(categorie.onderdeelId, perNaam);
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
    const bestaand = await db().query.materiaal.findFirst({
      where: and(
        eq(materiaal.onderdeelId, onderdeel.id),
        eq(materiaal.materiaalId, rij.materiaalId)
      ),
      columns: { id: true, categorieId: true, veldwaarden: true },
    });

    const perNaam = categorieIndex.get(onderdeel.id);
    const categorie = rij.categorieNaam
      ? perNaam?.get(rij.categorieNaam.trim().toLowerCase())
      : bestaand
        ? categorieById.get(bestaand.categorieId)
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
    const categorieVelden = veldenPerCategorie.get(categorie.id) ?? [];
    const veldIds = new Set(categorieVelden.map((v) => v.id));
    const veldwaarden: Record<string, string> = {};
    if (bestaand) {
      for (const [id, waarde] of Object.entries(leesVeldwaarden(bestaand.veldwaarden))) {
        if (veldIds.has(id)) veldwaarden[id] = waarde;
      }
    }
    for (const veld of categorieVelden) {
      for (const kolom of veldKolomSleutels(categorie.naam, veld.naam)) {
        const waarde = rij.veldkolommen[kolom];
        if (waarde) {
          veldwaarden[veld.id] = waarde;
          break;
        }
      }
    }

    if (bestaand) {
      await db()
        .update(materiaal)
        .set({
          categorieId: categorie.id,
          // Lege cellen laten de huidige waarde staan; leegmaken doe je in de app.
          ...(rij.merkModel ? { merkModel: rij.merkModel } : {}),
          ...(rij.locatie ? { locatie: rij.locatie } : {}),
          ...(status ? { status } : {}),
          ...(status && status !== "TER_GOEDKEURING" ? { statusVoorKeuring: null } : {}),
          ...(inGebruikSinds ? { inGebruikSinds } : {}),
          veldwaarden: JSON.stringify(veldwaarden),
        })
        .where(eq(materiaal.id, bestaand.id));
      materiaalIndex.set(sleutel, bestaand.id);
      bijgewerkt++;
    } else {
      const id = nieuwId("mat");
      await db().insert(materiaal).values({
        id,
        materiaalId: rij.materiaalId,
        onderdeelId: onderdeel.id,
        categorieId: categorie.id,
        merkModel: rij.merkModel,
        locatie: rij.locatie,
        status: status ?? "IN_GEBRUIK",
        inGebruikSinds: inGebruikSinds ?? new Date(),
        veldwaarden: JSON.stringify(veldwaarden),
        aangemaakt: new Date(),
      });
      materiaalIndex.set(sleutel, id);
      toegevoegd++;
    }
    geraakteSlugs.add(onderdeel.slug);
  }

  /* ---------- optioneel tabblad "Onderhoudslog" ---------- */

  let logToegevoegd = 0;
  let logOvergeslagen = 0;

  if (werkboek.logRijen.length > 0) {
    const alleMedewerkers = await db()
      .select({ id: medewerkers.id, naam: medewerkers.naam })
      .from(medewerkers);
    const medewerkerByNaam = new Map(
      alleMedewerkers.map((m) => [m.naam.trim().toLowerCase(), m])
    );

    const teMaken: (typeof logregels.$inferInsert)[] = [];
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
        meld(
          rij.onderdeelNaam ? `onbekend onderdeel "${rij.onderdeelNaam}"` : "geen onderdeel bekend"
        );
        continue;
      }
      if (!rij.tijdstip) {
        meld("ongeldige of ontbrekende datum");
        continue;
      }

      const sleutel = `${onderdeel.id}|${rij.materiaalId}`;
      let materiaalDbId = materiaalIndex.get(sleutel);
      if (!materiaalDbId) {
        const gevonden = await db().query.materiaal.findFirst({
          where: and(
            eq(materiaal.onderdeelId, onderdeel.id),
            eq(materiaal.materiaalId, rij.materiaalId)
          ),
          columns: { id: true },
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
        id: nieuwId("log"),
        materiaalDbId,
        actieNaam: rij.actie,
        opmerking: rij.opmerking,
        statusNa: leesStatus(rij.statusNaRuw),
        medewerkerId: medewerker?.id ?? beheerder.id,
        medewerkerNaam: rij.medewerkerNaam || medewerker?.naam || beheerder.naam,
        tijdstip: rij.tijdstip,
        soort: "REGISTRATIE",
        clientId,
      });
      geraakteSlugs.add(onderdeel.slug);
    }

    for (const regel of teMaken) {
      // clientId is uniek: regels die al eerder geïmporteerd zijn slaan we over.
      const resultaat = await db().insert(logregels).values(regel).onConflictDoNothing();
      if (resultaat.meta.changes > 0) logToegevoegd++;
      else logOvergeslagen++;
    }
  }

  await db().insert(beheerlog).values({
    id: nieuwId("bl"),
    medewerkerId: beheerder.id,
    wat: "Excel-import",
    detail: JSON.stringify({
      bestand: bestand.name,
      onderdeel: standaardOnderdeel?.slug ?? "alles",
      // "regels" en "overgeslagen" leest de beheerpagina uit als samenvatting.
      regels: toegevoegd + bijgewerkt,
      overgeslagen: matOvergeslagen,
      nieuw: toegevoegd,
      bijgewerkt,
      logToegevoegd,
    }),
    tijdstip: new Date(),
  });

  // Parameternamen zoals de beheerpagina ze uitleest: ok / nieuw / bijgewerkt /
  // overgeslagen, aangevuld met de logtellers en de reden per overgeslagen regel.
  const doelSlug = standaardOnderdeel?.slug ?? [...geraakteSlugs][0] ?? "";
  return terugNaarBeheer(url, doelSlug, {
    ok: "1",
    nieuw: String(toegevoegd),
    bijgewerkt: String(bijgewerkt),
    overgeslagen: String(matOvergeslagen),
    logToegevoegd: String(logToegevoegd),
    logOvergeslagen: String(logOvergeslagen),
    ...(overgeslagen.length > 0 ? { overgeslagenDetail: kortDetail(overgeslagen) } : {}),
  });
};

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
function terugNaarBeheer(basis: URL, slug: string, params: Record<string, string>): Response {
  const qs = new URLSearchParams(params).toString();
  const pad = slug ? `/${encodeURIComponent(slug)}/beheer` : "/onderdeel";
  return Response.redirect(new URL(`${pad}?${qs}`, basis), 303);
}

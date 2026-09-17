import * as XLSX from "xlsx";
import { STATUS_LABELS } from "@/lib/domein";
import type { Status } from "@/db/schema";

/**
 * Eén werkboek met twee tabbladen: "Materiaal" en "Onderhoudslog". De
 * categorie-eigen velden (VeldDefinitie) krijgen elk een eigen kolom met de kop
 * "{Categorie} · {Veld}", zodat dezelfde export weer geïmporteerd kan worden.
 *
 * Dit bestand doet alleen het lezen/schrijven van het bestand; het matchen op
 * onderdeel, categorie en medewerker gebeurt in de importroute.
 */

export const MATERIAAL_BLAD = "Materiaal";
export const LOG_BLAD = "Onderhoudslog";

/** Datums worden in Nederlandse wandkloktijd geschreven én gelezen. */
const TIJDZONE = "Europe/Amsterdam";

/* ------------------------------------------------------------------ */
/* Kolomkoppen                                                         */
/* ------------------------------------------------------------------ */

/** "Merk/model" en "merk / model" worden allebei "merkmodel". */
function normHeader(h: unknown): string {
  return String(h ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Kolomkop van een categorie-eigen veld, bv. "Ski · DIN-bereik". */
export function veldKolomKop(categorieNaam: string, veldNaam: string): string {
  return `${categorieNaam} · ${veldNaam}`;
}

/**
 * Sleutels waarop een veldkolom herkend wordt: eerst de volledige kop, daarna
 * alleen de veldnaam (zodat een handgemaakte lijst zonder categorieprefix ook
 * werkt).
 */
export function veldKolomSleutels(categorieNaam: string, veldNaam: string): string[] {
  return [normHeader(veldKolomKop(categorieNaam, veldNaam)), normHeader(veldNaam)];
}

const MATERIAAL_KOPPEN: Record<string, string> = {
  materiaalid: "materiaalId",
  id: "materiaalId",
  onderdeel: "onderdeel",
  categorie: "categorie",
  type: "categorie",
  merkmodel: "merkModel",
  merk: "merk",
  model: "model",
  locatie: "locatie",
  status: "status",
  ingebruiksinds: "inGebruikSinds",
  ingebruikvanaf: "inGebruikSinds",
  laatsteonderhoud: "laatsteOnderhoud",
  onderhoudsbeurten: "aantalBeurten",
  aantalbeurten: "aantalBeurten",
};

const LOG_KOPPEN: Record<string, string> = {
  datum: "datum",
  tijd: "tijd",
  tijdstip: "datum",
  materiaalid: "materiaalId",
  id: "materiaalId",
  onderdeel: "onderdeel",
  categorie: "categorie",
  actie: "actie",
  medewerker: "medewerker",
  uitgevoerddoor: "medewerker",
  door: "medewerker",
  statusnaactie: "statusNa",
  statusna: "statusNa",
  status: "statusNa",
  opmerking: "opmerking",
  opmerkingen: "opmerking",
};

/* ------------------------------------------------------------------ */
/* Datum en tijd                                                       */
/* ------------------------------------------------------------------ */

type Wandklok = { jaar: number; maand: number; dag: number; uur: number; minuut: number };

function wandklok(instant: Date): Wandklok {
  const delen: Record<string, string> = {};
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIJDZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  for (const deel of dtf.formatToParts(instant)) {
    if (deel.type !== "literal") delen[deel.type] = deel.value;
  }
  return {
    jaar: Number(delen.year),
    maand: Number(delen.month),
    dag: Number(delen.day),
    // Sommige ICU-versies geven 24 in plaats van 0 voor middernacht.
    uur: Number(delen.hour) % 24,
    minuut: Number(delen.minute),
  };
}

function zoneOffsetMs(instant: Date): number {
  const k = wandklok(instant);
  // Wandklok kent geen seconden, dus vergelijken we op hele minuten.
  const opDeMinuut = Math.floor(instant.getTime() / 60_000) * 60_000;
  return Date.UTC(k.jaar, k.maand - 1, k.dag, k.uur, k.minuut) - opDeMinuut;
}

/** Wandkloktijd in Nederland → het echte tijdstip. */
function uitZone(jaar: number, maand: number, dag: number, uur = 0, minuut = 0): Date {
  const gok = Date.UTC(jaar, maand - 1, dag, uur, minuut);
  // Tweede ronde vangt de zomer-/wintertijdovergang.
  const eerste = gok - zoneOffsetMs(new Date(gok));
  return new Date(gok - zoneOffsetMs(new Date(eerste)));
}

function tweeCijfers(n: number): string {
  return String(n).padStart(2, "0");
}

/** 16-09-2026 */
export function formatDatumCel(d: Date): string {
  const k = wandklok(d);
  return `${tweeCijfers(k.dag)}-${tweeCijfers(k.maand)}-${k.jaar}`;
}

/** 14:35 */
export function formatTijdCel(d: Date): string {
  const k = wandklok(d);
  return `${tweeCijfers(k.uur)}:${tweeCijfers(k.minuut)}`;
}

/**
 * Leest een datumcel: een echte Excel-datum, een serienummer of tekst
 * (dd-mm-jjjj, dd/mm/jjjj, jjjj-mm-dd of ISO). Geeft null als het geen
 * herkenbare datum is, zodat de importroute de regel kan overslaan met reden.
 */
export function leesDatum(waarde: unknown, tijd?: unknown): Date | null {
  const extraTijd = leesTijd(tijd);

  if (waarde instanceof Date && !Number.isNaN(waarde.getTime())) {
    if (!extraTijd) return waarde;
    const k = wandklok(waarde);
    return uitZone(k.jaar, k.maand, k.dag, extraTijd.uur, extraTijd.minuut);
  }

  if (typeof waarde === "number" && Number.isFinite(waarde)) {
    const d = XLSX.SSF.parse_date_code(waarde);
    if (!d) return null;
    return uitZone(d.y, d.m, d.d, extraTijd?.uur ?? d.H ?? 0, extraTijd?.minuut ?? d.M ?? 0);
  }

  const tekst = String(waarde ?? "").trim();
  if (!tekst) return null;

  // dd-mm-jjjj of dd/mm/jjjj, eventueel met tijd erachter.
  const nl = tekst.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[ T](\d{1,2}):(\d{2}))?$/);
  if (nl) {
    return uitZone(
      Number(nl[3]),
      Number(nl[2]),
      Number(nl[1]),
      extraTijd?.uur ?? Number(nl[4] ?? 0),
      extraTijd?.minuut ?? Number(nl[5] ?? 0)
    );
  }

  // jjjj-mm-dd, eventueel met tijd erachter.
  const iso = tekst.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?$/);
  if (iso) {
    return uitZone(
      Number(iso[1]),
      Number(iso[2]),
      Number(iso[3]),
      extraTijd?.uur ?? Number(iso[4] ?? 0),
      extraTijd?.minuut ?? Number(iso[5] ?? 0)
    );
  }

  const gebeurd = new Date(tekst);
  if (!Number.isNaN(gebeurd.getTime())) return gebeurd;
  return null;
}

function leesTijd(waarde: unknown): { uur: number; minuut: number } | null {
  if (waarde instanceof Date && !Number.isNaN(waarde.getTime())) {
    const k = wandklok(waarde);
    return { uur: k.uur, minuut: k.minuut };
  }
  if (typeof waarde === "number" && Number.isFinite(waarde)) {
    // Excel bewaart een tijd als fractie van een etmaal.
    const minuten = Math.round((waarde % 1) * 24 * 60);
    return { uur: Math.floor(minuten / 60) % 24, minuut: minuten % 60 };
  }
  const tekst = String(waarde ?? "").trim();
  const m = tekst.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return { uur: Number(m[1]) % 24, minuut: Number(m[2]) };
}

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

/** Accepteert zowel het Nederlandse label ("In reparatie") als de enum-sleutel. */
export function leesStatus(ruw: unknown): Status | null {
  const norm = normHeader(ruw);
  if (!norm) return null;
  for (const [sleutel, label] of Object.entries(STATUS_LABELS) as [Status, string][]) {
    if (normHeader(sleutel) === norm || normHeader(label) === norm) return sleutel;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Veldwaarden                                                         */
/* ------------------------------------------------------------------ */

/** Materiaal.veldwaarden is JSON-tekst; hier maken we er een { id: tekst } van. */
export function leesVeldwaarden(json: unknown): Record<string, string> {
  if (typeof json === "string") {
    try {
      json = JSON.parse(json || "{}");
    } catch {
      return {};
    }
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  const uit: Record<string, string> = {};
  for (const [id, waarde] of Object.entries(json as Record<string, unknown>)) {
    if (waarde === null || waarde === undefined) continue;
    uit[id] = String(waarde);
  }
  return uit;
}

/* ------------------------------------------------------------------ */
/* Inlezen                                                             */
/* ------------------------------------------------------------------ */

function celNaarTekst(waarde: unknown): string {
  if (waarde === null || waarde === undefined) return "";
  if (waarde instanceof Date) return formatDatumCel(waarde);
  return String(waarde).trim();
}

type RuweRij = {
  /** Rijnummer zoals Excel het toont, voor begrijpelijke foutmeldingen. */
  rijnummer: number;
  waarden: Record<string, unknown>;
  /** Niet-herkende kolommen, op genormaliseerde kop — hier zitten de veldkolommen in. */
  overig: Record<string, string>;
};

function bladNaarRijen(
  blad: XLSX.WorkSheet,
  koppen: Record<string, string>,
  vereist: string[]
): RuweRij[] | null {
  const ruweRijen = XLSX.utils.sheet_to_json<unknown[]>(blad, {
    header: 1,
    defval: "",
    blankrows: true,
  });
  if (ruweRijen.length === 0) return null;

  // sheet_to_json begint bij de eerste gevulde rij; die offset houden we erbij.
  const bereik = XLSX.utils.decode_range(blad["!ref"] ?? "A1");
  const eersteRij = bereik.s.r;

  const kopIndex = ruweRijen.findIndex((rij) =>
    rij.some((cel) => vereist.includes(normHeader(cel)))
  );
  if (kopIndex === -1) return null;

  const kopCellen = ruweRijen[kopIndex].map(normHeader);

  return ruweRijen
    .slice(kopIndex + 1)
    .map((rij, i) => {
      const waarden: Record<string, unknown> = {};
      const overig: Record<string, string> = {};
      kopCellen.forEach((sleutel, kolom) => {
        if (!sleutel) return;
        const doel = koppen[sleutel];
        const cel = rij[kolom];
        if (doel) {
          waarden[doel] = cel;
        } else {
          const tekst = celNaarTekst(cel);
          if (tekst) overig[sleutel] = tekst;
        }
      });
      return {
        rijnummer: eersteRij + kopIndex + i + 2,
        waarden,
        overig,
      };
    })
    .filter(
      (rij) =>
        Object.values(rij.waarden).some((w) => celNaarTekst(w) !== "") ||
        Object.keys(rij.overig).length > 0
    );
}

export type ImportMateriaalRij = {
  rijnummer: number;
  materiaalId: string;
  onderdeelNaam: string;
  categorieNaam: string;
  merkModel: string;
  locatie: string;
  statusRuw: string;
  inGebruikSindsRuw: unknown;
  /** Genormaliseerde kolomkop → waarde; zie veldKolomSleutels(). */
  veldkolommen: Record<string, string>;
};

export type ImportLogRij = {
  rijnummer: number;
  materiaalId: string;
  onderdeelNaam: string;
  actie: string;
  medewerkerNaam: string;
  opmerking: string;
  statusNaRuw: string;
  tijdstip: Date | null;
};

export type ImportWerkboek = {
  materiaalRijen: ImportMateriaalRij[];
  logRijen: ImportLogRij[];
  materiaalBladGevonden: boolean;
  logBladGevonden: boolean;
};

export function parseImportWorkbook(buffer: ArrayBuffer): ImportWerkboek {
  const wb = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });

  const materiaalBlad =
    wb.SheetNames.find((n) => normHeader(n) === normHeader(MATERIAAL_BLAD)) ?? wb.SheetNames[0];
  const ruweMateriaalRijen = materiaalBlad
    ? bladNaarRijen(wb.Sheets[materiaalBlad], MATERIAAL_KOPPEN, ["materiaalid", "id"])
    : null;

  const materiaalRijen: ImportMateriaalRij[] = (ruweMateriaalRijen ?? []).map((rij) => {
    const merkModel = celNaarTekst(rij.waarden.merkModel);
    const merk = celNaarTekst(rij.waarden.merk);
    const model = celNaarTekst(rij.waarden.model);
    return {
      rijnummer: rij.rijnummer,
      materiaalId: celNaarTekst(rij.waarden.materiaalId).toUpperCase(),
      onderdeelNaam: celNaarTekst(rij.waarden.onderdeel),
      categorieNaam: celNaarTekst(rij.waarden.categorie),
      // Oudere lijsten hebben nog losse kolommen Merk en Model.
      merkModel: merkModel || [merk, model].filter(Boolean).join(" "),
      locatie: celNaarTekst(rij.waarden.locatie),
      statusRuw: celNaarTekst(rij.waarden.status),
      inGebruikSindsRuw: rij.waarden.inGebruikSinds,
      veldkolommen: rij.overig,
    };
  });

  const logBlad = wb.SheetNames.find((n) => normHeader(n) === normHeader(LOG_BLAD));
  const ruweLogRijen = logBlad
    ? bladNaarRijen(wb.Sheets[logBlad], LOG_KOPPEN, ["actie"])
    : null;

  const logRijen: ImportLogRij[] = (ruweLogRijen ?? []).map((rij) => ({
    rijnummer: rij.rijnummer,
    materiaalId: celNaarTekst(rij.waarden.materiaalId).toUpperCase(),
    onderdeelNaam: celNaarTekst(rij.waarden.onderdeel),
    actie: celNaarTekst(rij.waarden.actie),
    medewerkerNaam: celNaarTekst(rij.waarden.medewerker),
    opmerking: celNaarTekst(rij.waarden.opmerking),
    statusNaRuw: celNaarTekst(rij.waarden.statusNa),
    tijdstip: leesDatum(rij.waarden.datum, rij.waarden.tijd),
  }));

  return {
    materiaalRijen,
    logRijen,
    materiaalBladGevonden: ruweMateriaalRijen !== null,
    logBladGevonden: ruweLogRijen !== null,
  };
}

/* ------------------------------------------------------------------ */
/* Exporteren                                                          */
/* ------------------------------------------------------------------ */

export type ExportMateriaal = {
  materiaalId: string;
  onderdeelNaam: string;
  categorieNaam: string;
  merkModel: string;
  locatie: string;
  status: Status;
  inGebruikSinds: Date;
  laatsteOnderhoud: Date | null;
  aantalBeurten: number;
  /** { velddefinitieId: waarde } */
  veldwaarden: Record<string, string>;
};

export type ExportVeld = {
  id: string;
  naam: string;
  categorieNaam: string;
};

export type ExportLogRegel = {
  tijdstip: Date;
  materiaalId: string;
  onderdeelNaam: string;
  categorieNaam: string;
  actieNaam: string;
  medewerkerNaam: string;
  statusNa: Status | null;
  opmerking: string;
};

const MATERIAAL_VASTE_KOPPEN = [
  "Materiaal-ID",
  "Onderdeel",
  "Categorie",
  "Merk/model",
  "Locatie",
  "Status",
  "In gebruik sinds",
  "Laatste onderhoud",
  "Onderhoudsbeurten",
];

const LOG_KOPPEN_EXPORT = [
  "Datum",
  "Tijd",
  "Materiaal-ID",
  "Onderdeel",
  "Categorie",
  "Actie",
  "Medewerker",
  "Status na actie",
  "Opmerking",
];

export function buildExportWorkbook(input: {
  materialen: ExportMateriaal[];
  /** Velddefinities van de categorieën die in de export voorkomen, op volgorde. */
  velden: ExportVeld[];
  logs: ExportLogRegel[];
}): Buffer {
  // Twee velden met dezelfde kop (bv. een gearchiveerde én een nieuwe "DIN-bereik")
  // delen één kolom; de eerste gevulde waarde wint.
  const veldKolommen = new Map<string, string[]>();
  for (const veld of input.velden) {
    const kop = veldKolomKop(veld.categorieNaam, veld.naam);
    const ids = veldKolommen.get(kop);
    if (ids) ids.push(veld.id);
    else veldKolommen.set(kop, [veld.id]);
  }
  const veldKoppen = [...veldKolommen.keys()];

  const materiaalRijen = input.materialen.map((m) => [
    m.materiaalId,
    m.onderdeelNaam,
    m.categorieNaam,
    m.merkModel,
    m.locatie,
    STATUS_LABELS[m.status],
    formatDatumCel(m.inGebruikSinds),
    m.laatsteOnderhoud ? formatDatumCel(m.laatsteOnderhoud) : "",
    m.aantalBeurten,
    ...veldKoppen.map((kop) => {
      for (const id of veldKolommen.get(kop) ?? []) {
        const waarde = m.veldwaarden[id];
        if (waarde !== undefined && waarde !== null && String(waarde) !== "") {
          return String(waarde);
        }
      }
      return "";
    }),
  ]);

  const wsMateriaal = XLSX.utils.aoa_to_sheet([
    [...MATERIAAL_VASTE_KOPPEN, ...veldKoppen],
    ...materiaalRijen,
  ]);
  wsMateriaal["!cols"] = [
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 26 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 17 },
    { wch: 17 },
    ...veldKoppen.map((kop) => ({ wch: Math.max(14, Math.min(kop.length + 2, 32)) })),
  ];

  const logRijen = input.logs.map((l) => [
    formatDatumCel(l.tijdstip),
    formatTijdCel(l.tijdstip),
    l.materiaalId,
    l.onderdeelNaam,
    l.categorieNaam,
    l.actieNaam,
    l.medewerkerNaam,
    l.statusNa ? STATUS_LABELS[l.statusNa] : "",
    l.opmerking,
  ]);

  const wsLog = XLSX.utils.aoa_to_sheet([LOG_KOPPEN_EXPORT, ...logRijen]);
  wsLog["!cols"] = [
    { wch: 12 },
    { wch: 8 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 30 },
    { wch: 20 },
    { wch: 16 },
    { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsMateriaal, MATERIAAL_BLAD);
  XLSX.utils.book_append_sheet(wb, wsLog, LOG_BLAD);

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

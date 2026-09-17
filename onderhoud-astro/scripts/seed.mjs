/**
 * Genereert een idempotent SQL-bestand voor D1 en voert het uit met wrangler.
 *
 *   SEED_ADMIN_WACHTWOORD=... node scripts/seed.mjs            (lokale D1)
 *   SEED_ADMIN_WACHTWOORD=... node scripts/seed.mjs --remote   (D1 in Cloudflare)
 *   SEED_ADMIN_WACHTWOORD=... node scripts/seed.mjs --alleen-sql > seed.sql
 *
 * Alle id's zijn afgeleid van de data zelf, zodat opnieuw draaien niets
 * dupliceert. Configuratie (onderdelen, categorieën, acties, velden) wordt
 * bijgewerkt; materiaal en logregels worden alleen aangemaakt, nooit
 * overschreven — echte registraties blijven dus staan.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { webcrypto as crypto } from "node:crypto";

import { ONDERDELEN, MEDEWERKERS, MATERIAAL } from "./seed-data.mjs";

const ITERATIES = 210_000;

async function hashWachtwoord(wachtwoord) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const sleutel = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(wachtwoord),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIES, hash: "SHA-256" },
    sleutel,
    256
  );
  const b64 = (bytes) => Buffer.from(bytes).toString("base64");
  return `pbkdf2$${ITERATIES}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

/* ---------- hulpjes ---------- */

const slug = (waarde) =>
  waarde
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const tekst = (waarde) => `'${String(waarde).replace(/'/g, "''")}'`;
const nullbaar = (waarde) => (waarde === null || waarde === undefined ? "NULL" : tekst(waarde));
const bool = (waarde) => (waarde ? 1 : 0);

/** dagenGeleden → ms, zodat de seed relatief aan vandaag blijft. */
function dagen(aantal, uur = 9, minuut = 0) {
  const d = new Date();
  d.setDate(d.getDate() - aantal);
  d.setHours(uur, minuut, 0, 0);
  return d.getTime();
}

function maanden(aantal) {
  const d = new Date();
  d.setMonth(d.getMonth() - aantal);
  return d.getTime();
}

const NU = Date.now();
const regels = [];

/** Kolomnamen + waarden → INSERT met een conflictstrategie. */
function invoegen(tabel, rij, { bijwerken = [] } = {}) {
  const kolommen = Object.keys(rij);
  const waarden = kolommen.map((k) => rij[k]);
  // Zonder bij te werken kolommen: OR IGNORE, zodat élke unieke sleutel
  // (id, maar ook materiaal_id of client_id) de rij overslaat in plaats van te
  // laten struikelen.
  const kop = bijwerken.length ? "INSERT INTO" : "INSERT OR IGNORE INTO";
  const staart = bijwerken.length
    ? ` ON CONFLICT(id) DO UPDATE SET ${bijwerken.map((k) => `${k} = excluded.${k}`).join(", ")}`
    : "";
  regels.push(
    `${kop} ${tabel} (${kolommen.join(", ")}) VALUES (${waarden.join(", ")})${staart};`
  );
}

/* ---------- medewerkers ---------- */

const wachtwoord = process.env.SEED_ADMIN_WACHTWOORD;
if (!wachtwoord) {
  console.error("SEED_ADMIN_WACHTWOORD is niet ingesteld — nodig voor de eerste accounts.");
  process.exit(1);
}
const hash = await hashWachtwoord(wachtwoord);

const medewerkerOpNaam = new Map();
for (const m of MEDEWERKERS) {
  const id = `mw_${slug(m.gebruikersnaam)}`;
  medewerkerOpNaam.set(m.naam, { id, naam: m.naam });
  invoegen(
    "medewerkers",
    {
      id: tekst(id),
      naam: tekst(m.naam),
      gebruikersnaam: tekst(m.gebruikersnaam),
      // Bij een herseed het wachtwoord niet terugzetten: staat niet in bijwerken.
      wachtwoord_hash: tekst(hash),
      rol: tekst(m.rol),
      functie: tekst(m.functie),
      actief: bool(m.actief),
      aangemaakt: NU,
    },
    { bijwerken: ["naam", "rol", "functie", "actief"] }
  );
}

/* ---------- onderdelen → categorieën → acties + velden ---------- */

/** slug → { categorieNaam → { id, velden: Map<naam,id>, acties: Map<naam,{id,isAfkeuren}> } } */
const catalogus = new Map();

for (const o of ONDERDELEN) {
  const onderdeelId = `ond_${o.slug}`;
  invoegen(
    "onderdelen",
    {
      id: tekst(onderdeelId),
      naam: tekst(o.naam),
      slug: tekst(o.slug),
      accent: tekst(o.accent),
      accent_pressed: tekst(o.accentPressed),
      accent_tint: tekst(o.accentTint),
      icoon: tekst(o.icoon),
      uitgelicht: bool(o.uitgelicht),
      sortering: o.sortering ?? 0,
      aantal_indicatie: o.aantalIndicatie ?? 0,
    },
    {
      bijwerken: [
        "naam",
        "accent",
        "accent_pressed",
        "accent_tint",
        "icoon",
        "uitgelicht",
        "sortering",
        "aantal_indicatie",
      ],
    }
  );

  const categorieen = new Map();
  catalogus.set(o.slug, categorieen);

  for (const [i, c] of o.categorieen.entries()) {
    const categorieId = `cat_${o.slug}_${slug(c.naam)}`;
    invoegen(
      "categorieen",
      {
        id: tekst(categorieId),
        onderdeel_id: tekst(onderdeelId),
        naam: tekst(c.naam),
        sortering: i,
        archived_at: "NULL",
      },
      { bijwerken: ["naam", "sortering", "archived_at"] }
    );

    const acties = new Map();
    for (const [j, ruw] of c.acties.entries()) {
      const a = typeof ruw === "string" ? { naam: ruw, isAfkeuren: false } : ruw;
      const actieId = `act_${o.slug}_${slug(c.naam)}_${slug(a.naam)}`;
      acties.set(a.naam, { id: actieId, isAfkeuren: Boolean(a.isAfkeuren) });
      invoegen(
        "onderhoudsacties",
        {
          id: tekst(actieId),
          categorie_id: tekst(categorieId),
          naam: tekst(a.naam),
          is_afkeuren: bool(a.isAfkeuren),
          sortering: j,
          archived_at: "NULL",
        },
        { bijwerken: ["naam", "is_afkeuren", "sortering", "archived_at"] }
      );
    }

    const velden = new Map();
    for (const [j, v] of c.velden.entries()) {
      const veldId = `veld_${o.slug}_${slug(c.naam)}_${slug(v.naam)}`;
      velden.set(v.naam, veldId);
      invoegen(
        "velddefinities",
        {
          id: tekst(veldId),
          categorie_id: tekst(categorieId),
          naam: tekst(v.naam),
          type: tekst(v.type ?? "TEKST"),
          eenheid: nullbaar(v.eenheid),
          opties: tekst(JSON.stringify(v.opties ?? [])),
          sortering: j,
          archived_at: "NULL",
        },
        { bijwerken: ["naam", "type", "eenheid", "opties", "sortering", "archived_at"] }
      );
    }

    categorieen.set(c.naam, { id: categorieId, acties, velden });
  }
}

/* ---------- materiaal + logregels ---------- */

for (const [onderdeelSlug, stukken] of Object.entries(MATERIAAL)) {
  const categorieen = catalogus.get(onderdeelSlug);
  if (!categorieen) continue;
  const onderdeelId = `ond_${onderdeelSlug}`;

  for (const s of stukken) {
    const categorie = categorieen.get(s.categorie);
    if (!categorie) continue;

    const materiaalDbId = `mat_${onderdeelSlug}_${slug(s.materiaalId)}`;

    // Veldwaarden staan op velddefinitie-id, niet op naam.
    const veldwaarden = {};
    for (const [naam, waarde] of Object.entries(s.velden ?? {})) {
      const veldId = categorie.velden.get(naam);
      if (veldId) veldwaarden[veldId] = waarde;
    }

    const logs = s.log ?? [];
    const tijdstippen = logs.map((l) => dagen(l.dagen, l.uur ?? 9, l.minuut ?? 0));
    const laatste = tijdstippen.length ? Math.max(...tijdstippen) : null;

    invoegen("materiaal", {
      id: tekst(materiaalDbId),
      materiaal_id: tekst(s.materiaalId),
      onderdeel_id: tekst(onderdeelId),
      categorie_id: tekst(categorie.id),
      merk_model: tekst(s.merkModel),
      locatie: tekst(s.locatie ?? ""),
      status: tekst(s.status ?? "IN_GEBRUIK"),
      status_voor_keuring: nullbaar(s.statusVoorKeuring),
      in_gebruik_sinds: new Date(s.inGebruikSinds).getTime(),
      laatste_onderhoud: laatste ?? "NULL",
      aantal_beurten: logs.length + (s.extraBeurten ?? s.aantalBeurtenExtra ?? 0),
      veldwaarden: tekst(JSON.stringify(veldwaarden)),
      aangemaakt: NU,
    });

    for (const [i, l] of logs.entries()) {
      const medewerker = medewerkerOpNaam.get(l.door);
      if (!medewerker) continue;
      const actie = categorie.acties.get(l.actie);
      invoegen("logregels", {
        id: tekst(`log_${onderdeelSlug}_${slug(s.materiaalId)}_${i}`),
        materiaal_db_id: tekst(materiaalDbId),
        actie_naam: tekst(l.actie),
        actie_id: nullbaar(actie?.id),
        opmerking: tekst(l.opmerking ?? ""),
        status_na: nullbaar(l.statusNa),
        medewerker_id: tekst(medewerker.id),
        medewerker_naam: tekst(medewerker.naam),
        tijdstip: tijdstippen[i],
        soort: tekst(l.soort ?? "REGISTRATIE"),
        client_id: tekst(`seed:${s.materiaalId}:${l.actie}:${l.dagen}`),
      });
    }
  }
}

/* ---------- oudere registraties, zodat "onderhoud per actie" 12 maanden vult ---------- */

const actieveMedewerkers = MEDEWERKERS.filter((m) => m.actief).map((m) =>
  medewerkerOpNaam.get(m.naam)
);
let teller = 0;
for (const s of MATERIAAL["ski-snowboard"] ?? []) {
  const categorie = catalogus.get("ski-snowboard")?.get(s.categorie);
  if (!categorie) continue;
  const actieNamen = [...categorie.acties.entries()].filter(([, a]) => !a.isAfkeuren);
  if (!actieNamen.length) continue;

  for (let i = 0; i < 4; i++) {
    const [naam, actie] = actieNamen[i % actieNamen.length];
    const medewerker = actieveMedewerkers[teller % actieveMedewerkers.length];
    invoegen("logregels", {
      id: tekst(`log_extra_${slug(s.materiaalId)}_${i}`),
      materiaal_db_id: tekst(`mat_ski-snowboard_${slug(s.materiaalId)}`),
      actie_naam: tekst(naam),
      actie_id: tekst(actie.id),
      opmerking: tekst(""),
      status_na: "NULL",
      medewerker_id: tekst(medewerker.id),
      medewerker_naam: tekst(medewerker.naam),
      tijdstip: maanden(1 + ((teller * 2) % 11)),
      soort: tekst("REGISTRATIE"),
      client_id: tekst(`seed:extra:${s.materiaalId}:${i}`),
    });
    teller++;
  }
}

/* ---------- uitvoeren ---------- */

const sql = [
  "-- Gegenereerd door scripts/seed.mjs — niet met de hand bewerken.",
  ...regels,
].join("\n");

const argumenten = process.argv.slice(2);

if (argumenten.includes("--alleen-sql")) {
  process.stdout.write(`${sql}\n`);
  process.exit(0);
}

const map = mkdtempSync(join(tmpdir(), "seed-"));
const bestand = join(map, "seed.sql");
writeFileSync(bestand, sql);

const doel = argumenten.includes("--remote") ? "--remote" : "--local";
console.log(`Seeden (${doel}): ${regels.length} regels…`);
// Op Windows is npx een .cmd-shim; zonder de extensie vindt execFileSync hem niet.
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
execFileSync(
  npx,
  ["wrangler", "d1", "execute", "onderhoud", doel, "--file", bestand, "--yes"],
  { stdio: "inherit" }
);
console.log("Seed klaar.");

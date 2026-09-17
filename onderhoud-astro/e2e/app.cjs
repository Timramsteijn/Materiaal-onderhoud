/* End-to-end test van de Astro-versie op http://localhost:4321 */
const { chromium } = require("playwright");

const BASIS = "http://localhost:4321";
const WACHTWOORD = process.env.SEED_ADMIN_WACHTWOORD || "devwachtwoord";

let geslaagd = 0;
const mislukt = [];

async function test(naam, fn) {
  try {
    await fn();
    geslaagd++;
    console.log(`  ✓ ${naam}`);
  } catch (err) {
    mislukt.push(naam);
    console.log(`  ✗ ${naam}\n      ${err.message.split("\n")[0]}`);
  }
}

function beweer(voorwaarde, melding) {
  if (!voorwaarde) throw new Error(melding);
}

/**
 * De kopkaart van het materiaalkaartje. De lijst ernaast bevat óók statussen,
 * dus alles wat over "dit" materiaal gaat wordt hierop gecontroleerd.
 */
function kopkaart(page, materiaalId) {
  return page.locator("main div.rounded-card").filter({ hasText: materiaalId }).first();
}

/** Astro haalt het ssr-attribuut van een island weg zodra het gehydrateerd is. */
async function gehydrateerd(page) {
  await page.waitForFunction(() => !document.querySelector("astro-island[ssr]"), null, {
    timeout: 15000,
  });
}

async function ga(page, pad) {
  await page.goto(`${BASIS}${pad}`, { waitUntil: "domcontentloaded" });
  await gehydrateerd(page);
}

async function inloggen(page, gebruikersnaam) {
  await page.goto(`${BASIS}/inloggen`, { waitUntil: "domcontentloaded" });
  const veld = page.locator("#gebruikersnaam-licht");
  await veld.fill(gebruikersnaam);
  await page.locator("#wachtwoord-licht").fill(WACHTWOORD);
  await Promise.all([
    page.waitForURL(/\/onderdeel/),
    page.locator("form:has(#gebruikersnaam-licht) button[type=submit]").click(),
  ]);
}

(async () => {
  const browser = await chromium.launch();

  /* ---------- desktop, beheerder ---------- */
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await desktop.newPage();

  console.log("\nInloggen en onderdeel kiezen");

  await test("zonder sessie stuurt / door naar /inloggen", async () => {
    const leeg = await browser.newContext();
    const p = await leeg.newPage();
    await p.goto(BASIS, { waitUntil: "domcontentloaded" });
    beweer(p.url().includes("/inloggen"), `verwacht /inloggen, kreeg ${p.url()}`);
    await leeg.close();
  });

  await test("verkeerd wachtwoord geeft een melding", async () => {
    const leeg = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await leeg.newPage();
    await p.goto(`${BASIS}/inloggen`, { waitUntil: "domcontentloaded" });
    await p.locator("#gebruikersnaam-licht").fill("t.verhoeven");
    await p.locator("#wachtwoord-licht").fill("fout-fout-fout");
    await p.locator("form:has(#gebruikersnaam-licht) button[type=submit]").click();
    await p.waitForLoadState("domcontentloaded");
    const tekst = await p.locator("body").innerText();
    beweer(/Onjuiste gebruikersnaam/i.test(tekst), "geen foutmelding getoond");
    await leeg.close();
  });

  await test("inloggen als beheerder komt op de onderdeelkeuze", async () => {
    await inloggen(page, "t.verhoeven");
    const tekst = await page.locator("main").innerText();
    beweer(/Kies een onderdeel/i.test(tekst), "geen keuzescherm");
    beweer(/Mountainbike/.test(tekst), "Mountainbike ontbreekt");
  });

  await test("onderdeelkaart toont het werkelijke aantal stuks", async () => {
    const tekst = await page.locator("main").innerText();
    beweer(/10 stuks/.test(tekst), "aantal ski-materiaal klopt niet");
  });

  console.log("\nScannen");

  await test("scanscherm opent met handmatige invoer", async () => {
    await ga(page, "/ski-snowboard/scannen");
    await page.waitForSelector("#handmatigId-desktop");
    beweer(await page.locator("#handmatigId-desktop").isVisible(), "invoerveld ontbreekt");
  });

  await test("onbekend ID navigeert niet en meldt het", async () => {
    await page.locator("#handmatigId-desktop").fill("SKI-0000");
    await page.locator("form:has(#handmatigId-desktop) button[type=submit]").click();
    await page.waitForTimeout(800);
    beweer(page.url().includes("/scannen"), `onverwacht genavigeerd naar ${page.url()}`);
    const tekst = await page.locator("main").innerText();
    beweer(/staat niet in/i.test(tekst), "geen melding bij onbekend ID");
  });

  await test("bekend ID opent het materiaalkaartje", async () => {
    await page.locator("#handmatigId-desktop").fill("SKI-0917");
    await Promise.all([
      page.waitForURL(/materiaal\/SKI-0917/),
      page.locator("form:has(#handmatigId-desktop) button[type=submit]").click(),
    ]);
  });

  console.log("\nMateriaal");

  await test("kaartje toont categorievelden en historie", async () => {
    const tekst = await page.locator("main").innerText();
    beweer(/Rossignol Experience 78/.test(tekst), "merk/model ontbreekt");
    beweer(/DIN-bereik/i.test(tekst), "categorieveld ontbreekt");
    beweer(/Historie/i.test(tekst), "historie ontbreekt");
  });

  await test("lijst filtert op zoekterm", async () => {
    await ga(page, "/ski-snowboard/materiaal?q=sb-");
    const tekst = await page.locator("main").innerText();
    beweer(/SB-0231/.test(tekst), "SB-0231 ontbreekt");
    beweer(!/SKI-0842/.test(tekst), "SKI-0842 had gefilterd moeten zijn");
  });

  await test("lijst filtert op categorie", async () => {
    await ga(page, "/ski-snowboard/materiaal");
    const pil = page.locator("main a", { hasText: /^Snowboard$/i }).first();
    await pil.click();
    await page.waitForLoadState("domcontentloaded");
    const tekst = await page.locator("main").innerText();
    beweer(/Snowboard/.test(tekst), "categorienaam ontbreekt");
    beweer(!/SCH-1104/.test(tekst), "schoenen hadden gefilterd moeten zijn");
  });

  let nieuwId = `TST-${Date.now().toString().slice(-6)}`;

  await test("nieuw materiaal aanmaken lukt", async () => {
    await ga(page, "/ski-snowboard/materiaal/nieuw");
    await page.locator("#materiaalId").fill(nieuwId);
    await page.locator("#merkModel").fill("Testski 1");
    await page.locator("#locatie").fill("Rek Z-99");
    await Promise.all([
      page.waitForURL(new RegExp(`materiaal/${nieuwId}`)),
      page.locator('button:has-text("Materiaal opslaan")').click(),
    ]);
    const tekst = await page.locator("main").innerText();
    beweer(tekst.includes(nieuwId), "nieuw ID niet op het kaartje");
  });

  await test("dubbel Materiaal-ID wordt geweigerd", async () => {
    await ga(page, "/ski-snowboard/materiaal/nieuw");
    await page.locator("#materiaalId").fill(nieuwId);
    await page.locator("#merkModel").fill("Testski 2");
    await page.locator('button:has-text("Materiaal opslaan")').click();
    await page.waitForTimeout(900);
    const tekst = await page.locator("main").innerText();
    beweer(/bestaat al/i.test(tekst), "geen conflictmelding");
  });

  console.log("\nRegistreren en afkeuren");

  await test("onderhoud registreren voegt een logregel toe", async () => {
    await ga(page, `/ski-snowboard/materiaal/${nieuwId}`);
    await page.locator('button:has-text("Waxen")').first().click();
    await page.locator("#opmerking").fill("Testregistratie via e2e.");
    await Promise.all([
      page.waitForLoadState("load"),
      page.locator('button:has-text("Onderhoud opslaan")').click(),
    ]);
    await page.waitForTimeout(500);
    const tekst = await page.locator("main").innerText();
    beweer(/Testregistratie via e2e/.test(tekst), "logregel niet zichtbaar in historie");
  });

  await test("afkeuren zet het materiaal op Ter goedkeuring", async () => {
    await ga(page, `/ski-snowboard/materiaal/${nieuwId}`);
    await page.locator('button:has-text("Afkeuren")').first().click();
    const uitleg = await page.locator("main").innerText();
    beweer(/goedgekeurd door beheer/i.test(uitleg), "geen uitleg over goedkeuring");
    await page.locator("#opmerking").fill("Afkeuring via e2e.");
    await Promise.all([
      page.waitForLoadState("load"),
      page.locator('button:has-text("Afkeuring aanvragen")').click(),
    ]);
    await page.waitForTimeout(500);
    const tekst = await kopkaart(page, nieuwId).innerText();
    beweer(/Ter goedkeuring/i.test(tekst), "status is niet Ter goedkeuring");
  });

  await test("beheerder ziet de aanvraag en kan hem afwijzen", async () => {
    await ga(page, "/ski-snowboard/beheer");
    const kaart = page.locator("section:has-text('Afkeuringen ter goedkeuring')");
    beweer(await kaart.isVisible(), "afkeuringenkaart ontbreekt");
    const rij = kaart.locator("li", { hasText: nieuwId });
    await Promise.all([
      page.waitForLoadState("load"),
      rij.locator('button:has-text("Afwijzen")').click(),
    ]);
    await page.waitForTimeout(600);
    await ga(page, `/ski-snowboard/materiaal/${nieuwId}`);
    const kop = await kopkaart(page, nieuwId).innerText();
    beweer(!/Ter goedkeuring/i.test(kop), "status stond nog op Ter goedkeuring");
    const tekst = await page.locator("main").innerText();
    beweer(/Afkeuring afgewezen/i.test(tekst), "geen logregel voor de afwijzing");
  });

  console.log("\nLog en overzicht");

  await test("log toont registraties per dag", async () => {
    await ga(page, "/ski-snowboard/log");
    const tekst = await page.locator("main").innerText();
    beweer(/Vandaag/i.test(tekst), "geen dagkop");
    beweer(/registraties in de laatste 12 maanden/i.test(tekst), "geen samenvatting");
  });

  await test("log filtert op één materiaal", async () => {
    await ga(page, "/ski-snowboard/log?materiaal=SKI-0917");
    const tekst = await page.locator("main").innerText();
    beweer(/Alleen registraties van SKI-0917/i.test(tekst), "filtermelding ontbreekt");
    beweer(!/SB-0231/.test(tekst), "ander materiaal zichtbaar");
  });

  await test("overzicht toont tegels, grafiek en aandacht nodig", async () => {
    await ga(page, "/ski-snowboard/overzicht");
    const tekst = await page.locator("main").innerText();
    beweer(/Totaal materiaal/i.test(tekst), "tegels ontbreken");
    beweer(/Onderhoud per actie/i.test(tekst), "grafiek ontbreekt");
    beweer(/Aandacht nodig/i.test(tekst), "aandacht-nodig ontbreekt");
    beweer(/SKI-0208/.test(tekst), "verwacht materiaal ontbreekt in aandacht nodig");
  });

  console.log("\nBeheer");

  await test("categorie uitklappen toont acties en velden", async () => {
    await ga(page, "/ski-snowboard/beheer");
    const tekst = await page.locator("main").innerText();
    beweer(/Onderhoudsacties/i.test(tekst), "acties ontbreken");
    beweer(/Eigen velden/i.test(tekst), "velden ontbreken");
    beweer(/DIN-bereik/i.test(tekst), "velddefinitie ontbreekt");
  });

  await test("actie toevoegen aan een categorie lukt", async () => {
    const naam = `E2E-actie-${Date.now().toString().slice(-5)}`;
    await page.locator('input[placeholder="Nieuwe actie"]').first().fill(naam);
    await Promise.all([
      page.waitForLoadState("load"),
      page
        .locator('form:has(input[placeholder="Nieuwe actie"]) button[type=submit]')
        .first()
        .click(),
    ]);
    await page.waitForTimeout(500);
    const tekst = await page.locator("main").innerText();
    beweer(tekst.includes(naam), "nieuwe actie niet zichtbaar");
  });

  await test("medewerkerlijst toont rollen", async () => {
    const tekst = await page.locator("main").innerText();
    beweer(/Sanne de Groot/.test(tekst), "medewerker ontbreekt");
    beweer(/Inactief/i.test(tekst), "inactieve medewerker ontbreekt");
  });

  console.log("\nPrinten");

  await test("los label rendert een QR", async () => {
    await ga(page, "/ski-snowboard/materiaal/SKI-0917/labels");
    beweer(await page.locator(".label-id").isVisible(), "label ontbreekt");
    beweer((await page.locator(".qr svg").count()) === 1, "geen QR-code");
  });

  await test("printvel bevat 12 cellen per vel", async () => {
    await ga(page, "/ski-snowboard/materiaal/labels");
    const cellen = await page.locator(".vel").first().locator(".cel").count();
    beweer(cellen === 12, `verwacht 12 cellen, kreeg ${cellen}`);
  });

  console.log("\nRollen");

  await test("medewerker ziet geen Beheer in de navigatie", async () => {
    const mw = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await mw.newPage();
    await p.goto(`${BASIS}/inloggen`, { waitUntil: "domcontentloaded" });
    await p.locator("#gebruikersnaam-licht").fill("s.degroot");
    await p.locator("#wachtwoord-licht").fill(WACHTWOORD);
    await Promise.all([
      p.waitForURL(/\/onderdeel/),
      p.locator("form:has(#gebruikersnaam-licht) button[type=submit]").click(),
    ]);
    await p.goto(`${BASIS}/ski-snowboard/scannen`, { waitUntil: "domcontentloaded" });
    const nav = await p.locator("aside").innerText();
    beweer(!/Beheer/i.test(nav), "Beheer staat in de navigatie van een medewerker");

    await p.goto(`${BASIS}/ski-snowboard/beheer`, { waitUntil: "domcontentloaded" });
    beweer(p.url().includes("/scannen"), `medewerker kwam op ${p.url()}`);
    await mw.close();
  });

  await test("uitloggen werkt", async () => {
    await ga(page, "/ski-snowboard/scannen");
    await Promise.all([
      page.waitForURL(/\/inloggen/),
      page.locator('form[action="/uitloggen"] button').locator("visible=true").first().click(),
    ]);
  });

  console.log("\nMobiel");

  await test("mobiel toont de tabbalk en geen zijnav", async () => {
    const mobiel = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await mobiel.newPage();
    await p.goto(`${BASIS}/inloggen`, { waitUntil: "domcontentloaded" });
    await p.locator("#gebruikersnaam-donker").fill("t.verhoeven");
    await p.locator("#wachtwoord-donker").fill(WACHTWOORD);
    await Promise.all([
      p.waitForURL(/\/onderdeel/),
      p.locator("form:has(#gebruikersnaam-donker) button[type=submit]").click(),
    ]);
    await p.goto(`${BASIS}/ski-snowboard/materiaal`, { waitUntil: "domcontentloaded" });
    beweer(await p.locator("nav.fixed").isVisible(), "tabbalk ontbreekt");
    beweer(!(await p.locator("aside").isVisible()), "zijnav zichtbaar op mobiel");
    await mobiel.close();
  });

  await browser.close();

  console.log(`\n${geslaagd}/${geslaagd + mislukt.length} tests geslaagd`);
  if (mislukt.length) {
    console.log(`Mislukt: ${mislukt.join(", ")}`);
    process.exit(1);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

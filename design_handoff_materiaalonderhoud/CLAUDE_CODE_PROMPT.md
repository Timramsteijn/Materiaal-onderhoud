# Prompt voor Claude Code — Materiaalonderhoud (Outdoor Valley)

> Kopieer alles onder de streep in Claude Code, in de map van het project. Voeg de map
> `design_handoff_materiaalonderhoud/` (met `Materiaalonderhoud.dc.html`, `README.md` en dit
> bestand) toe aan de repo, zodat Claude Code de ontwerpen kan openen.

---

## 0. Opdracht in één alinea

Bouw een interne webapp waarmee medewerkers van Outdoor Valley onderhoud aan verhuurmateriaal
registreren. Een medewerker logt in, kiest één bedrijfsonderdeel en werkt daarna volledig binnen
dat onderdeel: materiaal identificeren via de QR-sticker (scannen of Materiaal-ID intypen), per
stuk materiaal onderhoudsacties loggen met opmerking en eventuele statuswijziging. Beheerders
beheren categorieën, onderhoudsacties, veldbepalingen en medewerkers, keuren afkeuringen goed en
importeren/exporteren via Excel. Mobiel-eerst (telefoon in de werkplaats, met handschoenen, slecht
bereik) en volwaardig op desktop (werkplaatspc, kantoor).

In `design_handoff_materiaalonderhoud/Materiaalonderhoud.dc.html` staat een **volledig
uitgewerkte, klikbare high-fidelity mockup**: 8 desktopweergaven + 9 telefoonschermen voor Ski &
Snowboard, 6 desktopweergaven + 4 telefoonschermen voor Mountainbike, 2 printweergaven en 4
fouttoestanden/dialogen. `README.md` in dezelfde map is de schermspecificatie: per scherm de
layout, componenten, copy en voorbeelddata.

**Let op:** de kleur- en typografietabel in `README.md` is verouderd (die beschrijft een eerdere
versie met Archivo italic en oranje als appkleur). De tabellen in **§4 van dit bestand** zijn
leidend. De schermbeschrijvingen, copy, data en gedragsregels in `README.md` gelden onverkort.

## 1. Wat de ontwerpbestanden zijn

De HTML in de handoff is een **ontwerpreferentie, geen productiecode**. Het is één canvas met alle
schermen naast elkaar; navigatie bestaat uit anchor-links. Neem de markup niet over. Bouw de
schermen opnieuw op in de gekozen stack, met echte routing, echte data en echte state. Wat je wél
pixel-getrouw overneemt: kleuren, typografie, maten, radii, schaduwen, spacing, iconen en alle
Nederlandse copy.

Bekijk de mockup voordat je begint: open het bestand in een browser (`support.js` staat ernaast en
is alleen nodig om het te bekijken — niet overnemen).

## 2. Stack

Er is nog geen codebase. Tenzij in de repo iets anders staat, bouw je:

- **Next.js (App Router) + TypeScript + React**
- **Tailwind CSS** met de tokens uit §4 als CSS-variabelen en Tailwind-theme-extensie
- **PostgreSQL + Prisma**
- **Auth**: credentials-sessie (Auth.js/NextAuth met een eigen provider tegen de
  medewerkerstabel), bcrypt/argon2 gehashte wachtwoorden, rolcheck in middleware én in server
  actions — nooit alleen in de UI
- **PWA**: installeerbaar, service worker, offline schrijfwachtrij in IndexedDB (zie §7)
- **QR-scannen**: `@zxing/browser` of `html5-qrcode` op `getUserMedia`; altijd met handmatige
  ID-invoer als gelijkwaardig alternatief
- **Excel**: `exceljs` (import en export) server-side
- **Iconen**: `lucide-react`, stroke-width 2, 20px in tekst, 24px in knoppen, `currentColor`
- **Tests**: Vitest voor de domeinregels (§6), Playwright voor de drie kernflows (scannen →
  registreren, afkeuring aanvragen → goedkeuren, Excel-import)

Wijk hiervan af als de repo al iets anders gebruikt; leg de keuze dan vast in `README` van de repo.
Vraag niet om bevestiging voor routinekeuzes — bouw en documenteer.

## 3. Domeinmodel

Vijf onderdelen: **Ski & Snowboard** (1.248 stuks), **Mountainbike** (86), **Boogschieten** (142),
**Klimmateriaal** (310), **Kano/Kajak/SUP** (64). Ski & Snowboard is het meest gebruikte onderdeel
en staat op het keuzescherm uitgelicht.

Kernregel voor het hele ontwerp: **een onderdeel is puur configuratie, geen eigen code.**
Onderhoudsacties en extra materiaalvelden hangen aan de **categorie**, niet aan het onderdeel. Ski
en Snowboard zitten in hetzelfde onderdeel en hebben tóch verschillende actielijsten. Er mag nergens
een `if (onderdeel === 'ski')` in de code staan; Boogschieten, Klimmateriaal en Kano volgen hetzelfde
patroon zonder nieuwe componenten.

```prisma
model Onderdeel {
  id          String   @id @default(cuid())
  naam        String                 // "Ski & Snowboard"
  slug        String   @unique       // "ski-snowboard"
  accent      String                 // hex, zie §4 — accent is een eigenschap van het onderdeel
  accentInk   String
  accentTint  String
  icoon       String                 // lucide-naam of eigen key
  uitgelicht  Boolean  @default(false)
  sortering   Int
  categorieen Categorie[]
  materiaal   Materiaal[]
}

model Categorie {
  id           String   @id @default(cuid())
  onderdeelId  String
  naam         String                 // "Ski", "Snowboard", "Schoenen", "Helm", "Stokken"
  sortering    Int
  acties       OnderhoudsActie[]      // per categorie eigen set
  velden       VeldDefinitie[]        // per categorie eigen set
  materiaal    Materiaal[]
  @@unique([onderdeelId, naam])
}

model OnderhoudsActie {
  id          String  @id @default(cuid())
  categorieId String
  naam        String                  // "Slijpen", "Waxen", "Binding controleren", ...
  isAfkeuren  Boolean @default(false) // markeert de actie die de goedkeuringsflow start
  sortering   Int
  archivedAt  DateTime?               // verwijderen = archiveren; bestaande logregels blijven
}

model VeldDefinitie {
  id          String  @id @default(cuid())
  categorieId String
  naam        String                  // "Lengte", "DIN-bereik", "Accucapaciteit", ...
  type        VeldType                // TEKST | GETAL | BEREIK | DATUM | KEUZE
  eenheid     String?                 // "cm", "Wh", "m"
  opties      String[]                // bij KEUZE
  sortering   Int
  archivedAt  DateTime?
}

model Materiaal {
  id                String   @id @default(cuid())
  materiaalId       String                   // "SKI-0917" — handmatig ingevoerd, = QR-sticker
  onderdeelId       String
  categorieId       String
  merkModel         String
  locatie           String
  status            Status   @default(IN_GEBRUIK)
  inGebruikSinds    DateTime
  laatsteOnderhoud  DateTime?
  aantalBeurten     Int      @default(0)
  veldwaarden       Json                     // { veldDefinitieId: waarde }
  logregels         LogRegel[]
  @@unique([onderdeelId, materiaalId])
}

enum Status { IN_GEBRUIK IN_REPARATIE BUITEN_GEBRUIK TER_GOEDKEURING }

model LogRegel {                            // onveranderlijk
  id             String   @id @default(cuid())
  materiaalDbId  String
  actieNaam      String                     // tekstkopie, blijft staan als de actie verdwijnt
  actieId        String?
  opmerking      String
  statusNa       Status?                    // alleen als deze registratie de status wijzigde
  medewerkerId   String
  medewerkerNaam String                     // tekstkopie
  tijdstip       DateTime @default(now())
  soort          LogSoort @default(REGISTRATIE)
  clientId       String   @unique           // idempotentie voor de offline wachtrij
}

enum LogSoort { REGISTRATIE AFKEURING_AANGEVRAAGD AFKEURING_GOEDGEKEURD AFKEURING_AFGEWEZEN }

model Medewerker {
  id       String  @id @default(cuid())
  naam     String                            // "Tim Verhoeven"
  rol      Rol                               // BEHEERDER | MEDEWERKER | STAGIAIR
  functie  String                            // "Beheerder · Ski & Snowboard", vrije tekst
  actief   Boolean @default(true)
  hash     String
}

enum Rol { BEHEERDER MEDEWERKER STAGIAIR }

model BeheerLog {                            // acties, velden, medewerkers, imports
  id           String   @id @default(cuid())
  medewerkerId String
  wat          String
  detail       Json
  tijdstip     DateTime @default(now())
}
```

Seed met de data uit `README.md`: categorieën, acties en velddefinities per categorie voor Ski &
Snowboard en Mountainbike, de 7 + 7 voorbeeldstukken materiaal, de logregels, de vier medewerkers,
en twee openstaande afkeuringsaanvragen. Boogschieten, Klimmateriaal en Kano krijgen alleen een
onderdeelrij met hun aantal, zodat het keuzescherm klopt.

## 4. Design tokens — Outdoor Valley (leidend)

De app volgt de huisstijl van Outdoor Valley: donkere navy chrome, crème leesvlak, zandkleurige
grond, één accentkleur per onderdeel, vette display-koppen in Carter One.

### Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Carter+One&family=Figtree:wght@400;500;600;700;800&family=Permanent+Marker&display=swap" rel="stylesheet">
```

- **Carter One** — alle koppen en alle grote cijfers. Nooit in kapitalen, nooit cursief, nooit
  boven 50px (daarboven rastert de overlapnaad in N/M/W). Line-height 1.02–1.18.
- **Figtree** — alle lopende tekst (400), namen en nadruk (500/600), en **alle interface-tekst,
  labels, kickers, Materiaal-ID's en statusbadges** in 700/800. Labels uppercase met
  letter-spacing .10–.16em.
- **Permanent Marker** — niet gebruiken in deze app.
- Geen cursief. Geen vierde letter.

### Kleuren

| Rol | Hex |
| --- | --- |
| Navy — chrome: header, zijnav, tabbalk, donkere tegel, donker paneel | `#15212b` |
| Navy lichter — inputvlak op donker, hover zijnav | `#1e2e3a` |
| Rand op donker | `#2c3f4e` |
| Tekst secundair op donker | `#b5b7b6` |
| Crème — kaartvlak, leesvlak | `#f4f2ec` |
| Zand — paginagrond | `#e7e4db` |
| Rand/divider op licht, canvas buiten de frames | `#d8d5cc` |
| Neutrale vulling / badge-grond | `#dfddd4` |
| Tekst gedempt op licht (7:1 op crème) | `#535c61` |
| Tekst medium op licht | `#3c4a52` |
| Tekst / inkt | `#15212b` |
| **Accent Ski & Snowboard** (pisteblauw) — basis / hover-pressed / tint | `#1f5fd0` / `#17469b` / `#e4ecf9` |
| **Accent Mountainbike** (oranje) — basis / hover-pressed / tint | `#ff6a3d` / `#d1521f` / `#ffe7df` |
| Accenttekst op licht (Ski / MTB) | `#17469b` / `#a03c14` |
| Linkkleur / link-hover | `#17469b` / `#1f5fd0` |
| Status groen — tekst / cijfer / tint | `#46601a` / `#6b942a` / `#edf3e0` |
| Status amber (in reparatie) — tekst / tint | `#a03c14` / `#ffe7df` |
| Status rood — tekst / tint | `#9e2f23` / `#f7e3df` |
| Status ter goedkeuring — tekst / tint | `#17469b` / `#dfddd4` |
| Toggle uit | `#c2bcb0` |

Regels:

- **Het accent is een eigenschap van het onderdeel.** Eén set tokens (`--accent`,
  `--accent-pressed`, `--accent-tint`, `--accent-ink`), gezet bij het kiezen van het onderdeel,
  overal doorgevoerd: actieve navigatie, primaire knoppen, actieve filterpills, tijdlijnstippen,
  diagramstaven, de importeerknop, tellerbadges, en het actieve onderdeel in de chrome. Geen kleur
  hard in een component.
- **Wat niet meekleurt:** de navy chrome, de zandgrond, de statusbadges (status is een globale
  toestand), en de app-brede schermen inloggen en onderdeel kiezen — die blijven neutraal, met op
  het keuzescherm per kaart de eigen accentkleur van dat onderdeel.
- Tekst op een accentvlak is crème `#f4f2ec`, nooit navy — behalve op oranje, waar navy `#15212b`
  de juiste `--accent-on` is. Accentkleur nooit als leestekstkleur.
- Maximaal één accent per beeld. Nooit twee accenten tegen elkaar aan.
- Alle tekst haalt 4.5:1 tegen zijn achtergrond (koppen ≥24px mogen 3:1). Gedempte tekst op crème
  is `#535c61`, op navy `#b5b7b6` — niet omwisselen.

### Vorm, schaduw, spacing, beweging

- Radii: kaarten en panelen **10px**, inputs en textarea **8px**, knoppen/chips/pills/badges
  **999px** (volledig rond — alle knoppen zijn pills), desktopframe 14px, telefoonframe 30px.
- Schaduw alleen op lichte kaarten en dialogen, recht naar beneden, geen glow en geen gekleurde
  schaduw: licht `0 2px 8px rgba(21,33,43,.05)`, standaard `0 3px 10px rgba(21,33,43,.06)` /
  `0 3px 12px rgba(21,33,43,.07)`, hover `0 8px 20px rgba(21,33,43,.12)`.
- Randen 1px `#d8d5cc` op licht, 1px `#2c3f4e` op donker; 1.5–2px alleen waar het ontwerp dat doet
  (uitgelichte kaart, filterpills, tabelkop).
- Spacing: schermpadding mobiel 18px horizontaal / 14–22px verticaal, desktopcontent 22–26px,
  kaartpadding 13–18px, gap tussen kaarten 9–14px, tussen chips 8px, tussen kolommen 14–18px.
- Achtergronden: vlakke kleur. Geen gradients (behalve het cameraviewer-mockvlak), geen textuur,
  geen patronen, geen blur, geen glas-effect.
- Beweging: 160ms, één easing, geen bounce, geen entree-animaties, geen scale. Hover op primaire
  pill = 2px omhoog + iets diepere schaduw; pressed = terug naar nul. Alles stil onder
  `prefers-reduced-motion`.
- Focus: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` op álles
  interactief. Nooit de browserdefault.
- Sierlijst: geen emoji, geen zelfgetekende SVG-illustraties, geen gekleurde linkerbalk op kaarten.

### Logo

`assets/logo-ov-square.svg` is een **masker**: zet het als `mask`/`-webkit-mask` op een vlak en
geef het vlak de gewenste kleur, zodat het de accentkleur of crème volgt. Nooit de vulling
overschrijven met een andere kleur dan navy of crème, nooit kantelen, vervormen of van een schaduw
voorzien. Ondergrens 52px voor het volledige logo, 18px voor het losse kopteken. Kopieer de SVG mee
naar de nieuwe repo.

## 5. Routes en layout

Eén codebase, één opmaak. Onder ~900px de mobiele vorm (navy header + vaste tabbalk onderaan,
volle-breedte kaarten, detail als eigen pagina), vanaf ~900px de desktopvorm (232px navy zijnav,
66px witte topbalk, master/detail naast elkaar, dashboardgrid). Tabbalk en zijnav zijn twee
weergaven van dezelfde navigatie. Alle meeschalende maten in `clamp()`; grids met
`repeat(auto-fit, minmax(...))`; breekpunten alleen op 640/900/1200.

| Route | Scherm in de mockup |
| --- | --- |
| `/inloggen` | 01 / D01 |
| `/onderdeel` | 02 / D02 |
| `/{onderdeel}/scannen` | 03 / D03 — startscherm na keuze |
| `/{onderdeel}/materiaal` | 04 / D04 (links in master/detail) |
| `/{onderdeel}/materiaal/nieuw` | 08 / D05 |
| `/{onderdeel}/materiaal/{id}` | 05 / D04 (rechts in master/detail) |
| `/{onderdeel}/materiaal/{id}/labels` | 10 — los label 70×44 mm + A4-vel 3×4 |
| `/{onderdeel}/log` | 09 / D06 |
| `/{onderdeel}/overzicht` | 06 / D07 |
| `/{onderdeel}/beheer` | 07 / D08 — alleen beheerders |

Navitems (mobiel 5 cellen, desktop 5 pills): Scannen `scan-line`, Materiaal `package`, Log
`clipboard-list`, Overzicht `bar-chart-3`, Beheer `settings`. Voor een medewerker verdwijnt Beheer
en heeft de tabbalk vier cellen. Het actieve onderdeel staat altijd in de chrome (mobiel in de
header, desktop onderaan de zijnav) met een "wissel van onderdeel"-link. Nieuw materiaal en de
printweergaven hebben geen eigen navitem; daar blijft Materiaal actief.

Bouw elk scherm exact zoals `README.md` het beschrijft — inclusief de copy ("Houd de camera op de
sticker van het materiaal.", "Alles wat je hierna doet valt onder dit onderdeel.", "Het ID staat
onder de QR-code op de sticker.", "Wordt gelogd op {datum} om {tijd} door {medewerker}."), de
voorbeelddata, de kolombreedtes van de logtabel en de opbouw van de beheerkaarten. Copy niet
herschrijven of vertalen.

## 6. Domeinregels — hier zit de app in, niet in de UI

1. **Scoping.** Na inloggen kiest de medewerker één onderdeel; de keuze wordt vastgehouden
   (sessie + localStorage) en filtert élke query. Een materiaal-URL van een ander onderdeel geeft
   404, geen stille wissel.
2. **Materiaal-ID is handmatig.** Nooit automatisch genereren: het moet exact overeenkomen met de
   sticker. Uniek binnen het onderdeel. Nieuw materiaal start op **In gebruik**; er is geen
   statusveld op het aanmaakformulier.
3. **Registreren.** Actie verplicht (single select uit de acties van de categorie van dít stuk
   materiaal, default Reparatie), opmerking vrij, statuswijziging optioneel en als toggle
   (opnieuw tikken zet terug op leeg). Opslaan legt medewerker, datum en tijd vast, werkt de status
   bij als die gekozen is, verhoogt `aantalBeurten` en zet `laatsteOnderhoud` op nu.
4. **Logregels zijn onveranderlijk.** Een correctie is een nieuwe registratie, geen bewerking. Geen
   delete-endpoint op `LogRegel`.
5. **Afkeuren gaat via goedkeuring.** Een medewerker kan afkeuren wél aanvragen, niet doorvoeren.
   Kiest hij de actie "Afkeuren", dan verschijnt onder de actie-pills een blok met slot-icoon:
   "Afkeuren moet worden goedgekeurd door beheer. Het materiaal komt op 'Ter goedkeuring' en blijft
   uit de verhuur tot een beheerder de afkeuring bevestigt." Het knoplabel wordt "Afkeuring
   aanvragen" (na opslaan "Afkeuring aangevraagd"). Status wordt **Ter goedkeuring**: niet
   verhuurbaar, niet definitief afgekeurd. In Beheer staat bovenaan de kaart "Afkeuringen ter
   goedkeuring" (3px accent bovenrand, badge "{n} open") met per aanvraag ID, merk/model, reden,
   "Aangevraagd door {medewerker} · {tijd}" en de acties **Goedkeuren** (groen, → Buiten gebruik)
   en **Afwijzen** (outline rood, → vorige status). Beide beslissingen komen als eigen logregel op
   naam van de beheerder.
6. **Rollen.** Registreren mag iedereen. Verwijderen, importeren, goedkeuren en medewerkerbeheer
   alleen beheerders — afgedwongen op de server. Beheerwijzigingen worden gelogd in `BeheerLog`.
7. **Verwijderen is archiveren.** Een actie, veld of categorie verwijderen raakt bestaande
   logregels niet aan. Altijd eerst de bevestigingsmodal (420px, backdrop navy 55%): rode kicker
   met waarschuwingsicoon, de vraag als kop ("'Binding controleren' verwijderen uit Ski?"), de
   gevolgen ("De 96 bestaande registraties blijven in het onderhoudslog staan en worden niet
   gewijzigd."), het grijze blok "Alleen beheerders kunnen dit. De wijziging wordt gelogd op naam
   van {medewerker}.", dan Annuleren + Verwijderen. Zelfde patroon voor categorie verwijderen, veld
   verwijderen en medewerker deactiveren.
8. **"Aandacht nodig"** = langer dan 9 maanden geen enkele onderhoudsactie geregistreerd. Bereken
   dit, hardcode geen lijst.
9. **Zoeken** filtert op Materiaal-ID + merk/model, case-insensitive substring, live.
   **Filterpills** single-select, "Alles" reset. Zoek en filter werken gecombineerd en de
   resultaatregel noemt beide: "{n} van {totaal} stuks · {categorie}".
10. **Nooit stille mislukking.** Onbekend ID, lege lijst en verbroken verbinding hebben elk een
    zichtbare, benoemde toestand met een uitweg (zie §7). Na een onbekend ID wordt er nooit
    automatisch doorgenavigeerd.
11. **Excel.** Import vraagt een bestand, valideert per regel en meldt daarna aantal verwerkte en
    overgeslagen regels ("Laatste import: 02-09-2026 · 1.248 regels · 3 overgeslagen") met een
    lijst van de overgeslagen regels en de reden. Export levert de huidige scope/selectie.
12. **Handschoenen en snelheid.** Raakvlakken minimaal 44px, primaire actie altijd binnen
    duimbereik, scannen is het startscherm, en registreren is klaar in drie taps (actie → opslaan).
    Alles bedienbaar zonder muis; op desktop is het zoek-/ID-veld direct focusbaar.

## 7. De vier bijzondere toestanden

Deze zijn ontworpen en horen bij de oplevering, niet bij "later".

- **Onbekend ID** (scannen). Het ID-veld krijgt een 1.5px rode rand en rode tint, eronder een rode
  regel met cirkel-icoon: "{ID} staat niet in {onderdeel}. Controleer het ID of voeg het materiaal
  toe." Daaronder de outline pill "Nieuw materiaal".
- **Geen zoekresultaten** (materiaallijst). Crème kaart, gecentreerd: search-icoon, kop "Geen
  materiaal gevonden", uitleg die zowel de zoekterm als het actieve onderdeel noemt, en twee
  acties: "Filter wissen" (outline) en "Nieuw" (accent).
- **Offline.** Dit is een **eis**: de werkplaats en de hal hebben slecht bereik. Scannen en
  registreren blijven volledig lokaal werken; schrijfacties gaan in een IndexedDB-wachtrij met een
  `clientId` per regel en worden idempotent verstuurd zodra er verbinding is. Toon de donkere
  melding met doorgestreept wifi-icoon: "GEEN VERBINDING" in accentkleur + "Je kunt blijven scannen
  en registreren. Alles wordt verstuurd zodra de werkplaats weer bereik heeft." Daaronder de kaart
  "IN WACHTRIJ" met badge ({n} registraties) en de wachtende regels (ID, actie, tijd). De wachtrij
  loopt automatisch leeg; een conflict (materiaal is inmiddels gewijzigd) wordt gemeld, niet
  stilgeslikt.
- **Bevestiging bij verwijderen.** Zie regel 7 hierboven.

## 8. Printen — QR-labels

Twee weergaven, beide een wit vel met gestippelde sniplijnen die niet meeprinten.

- **Los label 70 × 44 mm**: QR links, rechts "OUTDOOR VALLEY" als kicker, het Materiaal-ID groot,
  merk/model + maat, en het onderdeel in de accentkleur.
- **Printvel A4, 12 labels in 3 × 4**: velpadding 36/30px, kop "MATERIAALLABELS · {ONDERDEEL}"
  links en "12 labels · {datum}" rechts. Per cel: QR 58px, ID, merk/model, en onderaan "OUTDOOR
  VALLEY · {ONDERDEEL}". Cellen delen hun rand (negatieve marge) zodat er één doorlopend snijraster
  ontstaat.

QR-inhoud: de absolute URL van het materiaalkaartje, zodat een scan met de telefooncamera ook
buiten de app werkt. Genereer server-side (`qrcode`). Het vel vult zich met de selectie uit de
materiaallijst. Zet `@page { size: A4; margin: 0 }` en zorg dat de sniplijnen `print-color-adjust`
correct afhandelen.

## 9. Bouwvolgorde

Werk in deze fasen en lever elke fase werkend op.

1. **Fundament** — project, Tailwind-theme met de tokens uit §4, fonts, logo-masker, de
   `Accent`-provider, layoutshell (navy zijnav + topbalk desktop, header + tabbalk mobiel) met de
   breekpuntwissel op 900px.
2. **Data** — Prisma-schema, migraties, seed met alle data uit `README.md` (Ski & Snowboard en
   Mountainbike volledig, de andere drie onderdelen als rij).
3. **Auth en scoping** — inloggen, onderdeel kiezen, rolcheck, wissel van onderdeel, uitloggen.
4. **Materiaal** — lijst met zoeken/filteren, detail met de datagestuurde categorievelden, nieuw
   materiaal. Inclusief de lege-lijst-toestand.
5. **Registreren** — het onderhoudsformulier, de historietijdlijn, de afkeuringsflow met
   goedkeuring in Beheer.
6. **Log** — mobiel gegroepeerd per dag, desktop als tabel met de vier filters.
7. **Overzicht** — de vier tegels en de twee diagrammen uit echte aggregaties.
8. **Beheer** — categorieën met acties en velddefinities (uitklaprijen, chips, toevoegen,
   archiveren met modal), medewerkers met schakelaar, Excel import/export.
9. **Scannen en offline** — camera + decoder, handmatige invoer, onbekend-ID-toestand, PWA,
   IndexedDB-wachtrij, synchronisatie.
10. **Printen** — los label en A4-vel.
11. **Afronden** — toetsenbordpad door de drie kernflows, focusringen, 44px-raakvlakken,
    contrastcheck, Playwright-tests, README in de repo met de configuratie van een nieuw onderdeel.

## 10. Klaar wanneer

- Alle 17 schermen bestaan, op mobiel en desktop, en volgen de mockup op kleur, type, maat en copy.
- Een nieuw onderdeel toevoegen (Boogschieten) kost alleen data: onderdeelrij + categorieën +
  acties + velddefinities. Geen codewijziging, geen nieuw component, geen nieuwe kleurregel in een
  component.
- Registreren werkt met uitgeschakelde netwerkverbinding en komt na herverbinding precies één keer
  binnen, ook na een refresh tussendoor.
- Een medewerker kan niet afkeuren, niet importeren en niet verwijderen — ook niet door de
  API direct aan te roepen.
- Elk interactief element heeft een zichtbare focusring en is ≥44px op mobiel.
- Geen tekst onder 4.5:1 contrast (koppen ≥24px mogen 3:1).

## 11. Niet doen

- Geen markup uit de mockup kopiëren; geen `support.js` in de repo.
- Geen emoji, geen gradients als decoratie, geen blur/glas, geen gekleurde schaduw, geen
  entree-animaties, geen cursief, geen Carter One boven 50px, geen Carter One in kapitalen.
- Geen accentkleur hardcoded in een component, geen `if (onderdeel === ...)`.
- Geen Materiaal-ID automatisch genereren, geen statusveld op het aanmaakformulier.
- Geen datumfilter in het onderhoudslog, geen aftellers, geen totaalscores.
- Geen telefoonnummer-CTA's, geen wervend-abstracte copy. Toon: direct, kort, tweede persoon, jij.
- Geen features bijbedenken die niet in de mockup of dit document staan. Kom je iets tegen dat
  ontbreekt, bouw dan het simpelste dat past en zet het als open punt in de repo-README.

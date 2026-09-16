# Handoff: Materiaalonderhoud (Outdoor Valley)

## Overview
Webapp waarmee medewerkers van Outdoor Valley onderhoud aan verhuurmateriaal registreren. Een medewerker logt in, kiest een bedrijfsonderdeel (Ski & Snowboard, Mountainbike, Boogschieten, Klimmateriaal, Kano/Kajak/SUP) en werkt daarna volledig binnen dat onderdeel. Materiaal wordt geïdentificeerd via een QR-sticker (scannen of Materiaal-ID intypen); per stuk materiaal worden onderhoudsacties gelogd met opmerking en eventuele statuswijziging. Beheerders importeren/exporteren via Excel en beheren categorieën, onderhoudsacties en medewerkers.

Mobiel-eerst (werkvloer/werkplaats, telefoon) én bruikbaar op desktop in de browser (werkplaatspc, kantoor).

## About the Design Files
De bestanden in deze bundel zijn **ontwerpreferenties, gemaakt in HTML** — prototypes die het bedoelde uiterlijk en gedrag tonen, geen productiecode om over te nemen. De opdracht is om deze ontwerpen **opnieuw op te bouwen in de bestaande omgeving van de doelcodebase** (React, Vue, Svelte, native, wat er al staat) met de daar gebruikelijke patronen en libraries. Bestaat die omgeving nog niet, kies dan zelf het meest passende framework en bouw de ontwerpen daarin.

`Materiaalonderhoud.dc.html` is één bestand met alle schermen naast elkaar op een canvas; het is geen app-router. De navigatie in het prototype bestaat uit anchor-links tussen frames — in de echte app is dat echte routing.

## Fidelity
**High-fidelity.** Kleuren, typografie, radii, schaduwen en copy zijn definitief en overgenomen van de Outdoor Valley website. Bouw de UI pixel-getrouw na met de libraries en patronen van de codebase. Voorbeelddata in het prototype is realistisch maar fictief.

## Bedrijfsstructuur en scoping
- Vijf onderdelen, elk met eigen materiaal en eigen categorieën.
- **Onderhoudsacties horen bij een categorie, niet bij het onderdeel.** Ski en Snowboard binnen hetzelfde onderdeel kunnen dus verschillende actielijsten hebben. Het formulier op het materiaalkaartje toont alleen de acties van de categorie van dat stuk materiaal.
- **Materiaalvelden zijn deels per categorie.** Naast de algemene velden (categorie, merk/model, locatie, in gebruik sinds, laatste groot onderhoud, onderhoudsbeurten) heeft elke categorie eigen velden: Ski → Lengte, DIN-bereik, Bindingtype, Radius · Snowboard → Lengte, Flex, Bindingmaat · Schoenen → Maat (mondopoint), Flexindex, Zoollengte · Helm → Maat, Productiejaar · Stokken → Lengte. Beheerders beheren die velddefinities per categorie.
- De bestaande testdata (oude acties Visueel controleren / Slijpen van de kanten / Controle bindingen / Algehele onderhoudsbeurt) wordt vervangen door de categorieën en acties uit dit ontwerp.
- Na inloggen kiest de medewerker één onderdeel. Alles daarna (scannen, lijst, detail, overzicht, beheer) is gescoped tot dat onderdeel.
- Het actieve onderdeel staat altijd in de chrome (mobiel: header; desktop: onderkant zijnavigatie) met een "wissel van onderdeel"-link terug naar de keuzelijst.
- Aantallen in het prototype: Ski & Snowboard 1.248, Mountainbike 86, Boogschieten 142, Klimmateriaal 310, Kano/Kajak/SUP 64. Ski & Snowboard is het meest gebruikte onderdeel en staat uitgelicht (2px oranje rand, oranje icoonvlak, oranje chevron).

## Design Tokens

### Kleuren
| Rol | Hex |
| --- | --- |
| Inkt / chrome (header, zijnav, tabbalk, donkere tegel) | #122028 |
| Inkt lichter (inputvlak op donker, hover zijnav) | #1B2C36 |
| Rand op donker | #2F4350 |
| Body-tekst secundair op donker | #8B9AA3 |
| Body-tekst op licht, gedempt | #566B76 |
| Body-tekst op licht, medium | #3C5260 |
| Achtergrond (zand) | #E7E3DA |
| Canvas buiten de frames | #D8D3C8 |
| Rand / divider op licht | #D8D3C8 |
| Rand kaart / neutrale vulling | #DAD5CA |
| Inputvulling op licht | #F3F0E9 |
| Kaartvlak | #FFFFFF |
| Accent per onderdeel — basis | Ski & Snowboard #1E6FD9 · Mountainbike #F4622B |
| Accent hover/pressed + accenttekst op tint | Ski & Snowboard #1857AE · Mountainbike #D9501C |
| Accenttint (tinted fills) | Ski & Snowboard #E3EDFB · Mountainbike #FBE6DC |
| Secundair staalblauw | #3F6E8C |
| Staalblauw donker (links, badge-tekst) | #2E5470 |
| Staalblauw tint (categorie-badge) | #E4E9EC |
| Status groen / tint | #3C9A5F (tekst #2F7B4C) op #E7F4EC |
| Status rood / tint | #D64550 op #FBEAEC |
| Toggle uit | #C2BCB0 |

Tekst op accentvlakken is altijd wit (#FFFFFF), nooit inkt.

**Het accent is een eigenschap van het onderdeel, niet van de app.** Elk onderdeel heeft één accentkleur die overal in dat onderdeel terugkomt: actieve navigatie, primaire knoppen, het actieve onderdeel in de header, actieve filterpills, tijdlijnstippen, de staven in beide diagrammen (per categorie én onderhoud per actie), de importeerknop en de tellerbadges. Ski & Snowboard gebruikt het ijsblauw van de wintersportsite (#1E6FD9, pressed #1857AE, tint #E3EDFB); Mountainbike houdt het oranje (#F4622B / #D9501C / #FBE6DC). De overige onderdelen krijgen elk hun eigen kleur uit de sitehuisstijl. Voer dit als één token per onderdeel in (bijvoorbeeld `--accent`, `--accent-pressed`, `--accent-tint`) en zet het bij het kiezen van het onderdeel; geen kleur hard in een component.

Wat níet meekleurt: de inkt-chrome (#122028), de zandgrond, **de statusbadges** (In gebruik groen, In reparatie amber #D9501C op #FBE6DC, Buiten gebruik rood, Ter goedkeuring staalblauw — status is een globale toestand, geen merkkleur, en moet in elk onderdeel dezelfde kleur hebben), het staalblauw van categorie-badges en links, en de app-brede schermen inloggen en onderdeel kiezen — die blijven neutraal, met op het keuzescherm per kaart de eigen accentkleur van dat onderdeel.

### Typografie
- Koppen, labels, ID's, cijfers: **Archivo**, `font-style: italic`, weight 800 (kleine labels 700). Uppercase met letter-spacing .08–.16em bij labels/kickers; koppen letter-spacing .02–.04em.
- Lopende tekst: **Source Sans 3**, weight 400 (500/600 voor namen en nadruk).
- Google Fonts: `Archivo:ital,wght@0,400;0,600;0,700;1,700;1,800;1,900` + `Source+Sans+3:wght@400;500;600;700`.
- Maten mobiel: schermtitel 22px, kaart-ID 16px, body 13–15px, labels 10–11px, statcijfers 34px.
- Maten desktop: detailtitel 32px, paneeltitel 17–20px, body 13–15px, labels 11–12.5px, statcijfers 40px.

### Radii
- Telefoonframe 30px, desktopframe 14px.
- Kaarten en panelen 10px.
- Inputs en textarea 8px (mobiel zoek/ID-veld 12px → in de echte app 8px is ook goed).
- Knoppen, chips, pills, badges: volledig rond (999px).

### Schaduwen
- Kaart licht: `0 2px 8px rgba(18,32,40,.05)`
- Kaart standaard: `0 3px 10px rgba(18,32,40,.06)` / `0 3px 12px rgba(18,32,40,.06)`
- Kaart hover: `0 8px 20px rgba(18,32,40,.12)`
- Frame op canvas: `0 18px 40px rgba(18,32,40,.22)`

### Spacing
Schermpadding mobiel 18px horizontaal, 14–22px verticaal. Desktop content 22–26px. Kaartpadding 13–18px. Gap tussen kaarten 9–14px, tussen chips 8px, tussen kolommen desktop 14–18px.

### Focus
Alle interactieve elementen: `:focus-visible { outline: 2px solid #F4622B; outline-offset: 2px; }`. Geen browserdefault. `::selection` oranje met inkt-tekst.

## Screens / Views — mobiel (390–420px breed, ontworpen op 400×836)

Elk scherm behalve inloggen en onderdeel-kiezen heeft:
- **Header** (#122028, padding 14px 18px): appnaam "MATERIAALONDERHOUD" (Archivo italic 800, 13px, letter-spacing .12em, uppercase, wit), daaronder het actieve onderdeel in oranje (#F4622B, 12px uppercase) plus tekstlink "wissel van onderdeel" (11px, #8B9AA3, 1px onderlijn #2F4350). Rechts een 36×36 uitlogknop (1px rand #2F4350, radius 10px, lucide `log-out`, hover rand oranje).
- **Tabbalk** onderaan (#122028, 8px bodempadding): vijf gelijke cellen — Scannen (`scan-line`), Materiaal (`package`), Log (`clipboard-list`), Overzicht (`bar-chart-3`), Beheer (`settings`). Icoon 21px + label Archivo italic 800, 10px, uppercase, letter-spacing .1em. Actief: 3px oranje bovenrand + oranje icoon en label; inactief #8B9AA3 met hover-bovenrand #3C5260.

### 01 Inloggen
Volledig donker scherm (#122028), padding 0 32px, verticaal gecentreerd. Logomerk: 52×52 vierkant met 2px oranje rand, radius 12px, lucide `triangle`-achtig bergicoon in oranje. Titel "MATERIAAL / ONDERHOUD" over twee regels (Archivo italic 800, 30px, wit), subregel "Outdoor Valley · verhuurmateriaal" (13px, #8B9AA3). Twee velden (gebruikersnaam "t.verhoeven", wachtwoord) met label in 11px uppercase #8B9AA3, input 48px hoog, vulling #1B2C36, rand 1px #2F4350, radius 12px, witte tekst. Inlogknop: 52px hoog, volledig oranje pill, label links uitgelijnd in wit uppercase, pijl-rechts icoon rechts, hover #D9501C. Onderaan "Wachtwoord vergeten? Vraag je locatiebeheerder." (13px, #8B9AA3). → naar onderdeel kiezen.

### 02 Onderdeel kiezen
Header zonder onderdeelregel (in plaats daarvan "Ingelogd als Tim Verhoeven"). Titel "Kies een onderdeel" + "Alles wat je hierna doet valt onder dit onderdeel." Vijf tikbare kaarten (wit, radius 10px, padding 16px, gap 12px): 46×46 icoonvlak (radius 10px; uitgelicht #FBE6DC met oranje icoon, overig #E4E9EC met staalblauw icoon), naam (Archivo italic 800, 17px, #122028), regel eronder met aantal stuks (13px #566B76; bij de uitgelichte "1.248 stuks · meest gebruikt"), chevron rechts. Uitgelicht: 2px #F4622B rand. Overige: 1px #DAD5CA, hover rand staalblauw. Iconen: ski's (twee verticale pills met bindingen + twee stokken), mountainbike, doelwit, berg, golven. → naar scannen.

### 03 Scannen
Titel "Scan de QR-code" + "Houd de camera op de sticker van het materiaal." Cameraviewer: 330px hoog, radius 10px, donkere diagonale gradient (#1B2C36 → #2F4350 → #122028) met subtiele diagonale streeplaag, in het midden een vaag grijs vlak (mock materiaal). Scanframe 230×230 gecentreerd: vier hoekmarkeringen 36×36 met 4px oranje randen en 8px hoekradius, plus horizontale scanlijn (2px oranje, glow `0 0 14px 2px rgba(242,169,59,.7)` → gebruik oranje glow). Onderin de viewer een gradientbalk met `scan-line` icoon en "Camera actief · richt op de QR-sticker". Daaronder scheiding "OF HANDMAAL" (label "of handmatig", 11px uppercase, 1px lijnen links/rechts). Witte kaart met label "MATERIAAL-ID", input (placeholder "bv. SKI-0917") + 56×48 oranje pill-knop met pijl, hint "Het ID staat onder de QR-code op de sticker." → naar materiaalkaartje.

### 04 Materiaal (lijst)
Zoekveld (48px, wit, radius 12px, `search`-icoon links, placeholder "Zoek op ID, merk of model"). Filterrij: horizontaal scrollende pills (scrollbar verborgen) — Alles, Ski, Snowboard, Schoenen, Helm, Stokken. Pill: Archivo italic 700, 11.5px uppercase, padding 9px 14px, radius 999px; inactief wit met 1.5px #D8D3C8 rand en #3C5260 tekst; actief #122028 met oranje tekst en rand. Resultaatregel "{n} van {totaal} stuks · {categorie}" (12px #566B76). Lijstkaarten (wit, radius 10px, padding 14px, 1px #DAD5CA rand, hover schaduw): ID (Archivo italic 800, 16px) + categorie-badge (staalblauw op #E4E9EC, pill), merk/model 13.5px #3C5260, metaregel 12px #8B9AA3 (locatie + laatste onderhoud), rechts statusbadge.

Statusbadges (pill, Archivo italic 800, 10px uppercase): In gebruik #2F7B4C op #E7F4EC · In reparatie #D9501C op #FBE6DC · Buiten gebruik #D64550 op #FBEAEC · **Ter goedkeuring** #2E5470 op #E4E9EC (afkeuring aangevraagd, wacht op beheer).

Voorbeelddata (7 stuks): SKI-0842 Atomic Redster X5 170 cm / In gebruik · SKI-0917 Rossignol Experience 78 158 cm / In reparatie · SB-0231 Burton Ripcord 154 cm / In gebruik · SCH-1104 Salomon X Access 80 maat 42 / Buiten gebruik · HLM-0455 Uvex Legend 2.0 maat M / In gebruik · SKI-1033 Völkl Deacon 74 163 cm / In gebruik · STK-0620 Leki Blue Bird 115 cm / In gebruik.

### 05 Materiaalkaartje (detail)
Teruglink "Terug naar materiaal" (chevron-left, staalblauw, 13px). Kopkaart: ID "SKI-0917" (Archivo italic 800, 26px), "Rossignol Experience 78", twee badges (categorie + status); rechts 78×78 QR-mock (donker vlak, radius 10px, blokpatroon) met tekstlink "printen" (`printer`-icoon, 11.5px).

Specificatiekaart (wit, rijen met 1px #E7E3DA onderlijn), in twee gelabelde groepen. Label links (Archivo italic 700, 11px uppercase #8B9AA3), waarde rechts uitgelijnd (13.5px #122028); groepskoppen Archivo italic 800, 11px uppercase — "ALGEMEEN" in #566B76, "VELDEN VAN CATEGORIE {categorie}" in #2E5470.
- Algemeen: Categorie Ski · Merk/model Rossignol Experience 78 · Locatie Werkplaats · werkbank 2 · In gebruik sinds 11-11-2023 · Laatste groot onderhoud 14-03-2026 · Onderhoudsbeurten 11.
- Velden van categorie Ski: Lengte 158 cm · DIN-bereik 3 – 10 · Bindingtype Look Xpress 10 · Radius 13 m.

De tweede groep is volledig datagestuurd: de velddefinities komen uit de categorie, dus bij een helm of stok staan daar andere (of minder) rijen en verschijnt DIN niet.

Formulier "ONDERHOUD REGISTREREN": label "ACTIE" + wrappende pills met de acties van de categorie van dit materiaal (voor Ski: Slijpen, Waxen, Binding controleren, Reparatie, Afkeuren) met dezelfde pill-styling als de filters (single select, default Reparatie); label "OPMERKING" + textarea 82px (vulling #F3F0E9, rand #D8D3C8, radius 8px, placeholder "Wat heb je gedaan of gezien?"); label "STATUS WIJZIGEN (optioneel)" + wrappende pills met de drie statussen (toggle: opnieuw tikken zet terug op leeg); primaire knop 52px oranje pill "Onderhoud opslaan" met check-icoon, na tikken label "Onderhoud opgeslagen"; regel "Wordt gelogd op 13-09-2026 om 09:14 door Tim Verhoeven."

Historiekaart "HISTORIE" met link "alles zien (11)": tijdlijnrijen met 9px oranje stip, actie (Archivo italic 800, 14px), datum rechts (12px #8B9AA3), uitvoerder (12.5px #566B76), opmerking (13px #3C5260):
1. Binding controleren · 22-08-2026 · Youssef El Amrani · "DIN teruggezet naar 6, linkerbinding loopt zwaar."
2. Waxen · 05-07-2026 · Sanne de Groot · "Standaard zomerwax na seizoensopslag."
3. Slijpen · 19-06-2026 · Tim Verhoeven · "Kanten bijgewerkt, lichte slag uit de linkerski."

### 06 Overzicht (dashboard)
Titel "Overzicht" + "Seizoen 2026/27 · bijgewerkt vandaag 09:14". Vier tegels in 2×2 grid: Totaal materiaal 1.248 (donkere tegel, wit cijfer), In gebruik 1.086 (groen), In reparatie 94 (oranje), Buiten gebruik 68 (rood); cijfers Archivo italic 800, 34px.

Kaart "PER CATEGORIE": naam + aantal, daaronder 7px voortgangsbalk (#E7E3DA spoor, staalblauwe vulling). Ski 612, Snowboard 214, Schoenen 268, Helm 104, Stokken 50 (schaal op max 612).

Kaart "ONDERHOUD PER ACTIE" + "Laatste 12 maanden · 531 registraties": staafdiagram, 150px hoog, waarde boven de staaf, label eronder. Waxen 214, Slijpen 168, Binding 96, Reparatie 41, Afkeuren 12 (schaal op max 214; staaf oranje, Afkeuren rood; radius 4px boven).

Kaart "AANDACHT NODIG" (`alert-triangle` + rode titel) met "Langer dan 9 maanden geen groot onderhoud.": SKI-0208 Head Kore 87 170 cm · 412 dgn · SB-0119 Nitro Prime 152 cm · 358 dgn · SCH-0761 Nordica Sportmachine maat 44 · 301 dgn. Dagen als rode pill-badge, chevron rechts, rij is tikbaar naar detail.

### 07 Beheer
Titel "Beheer" + "Alleen zichtbaar voor beheerders."
- Kaart "EXCEL": twee knoppen naast elkaar — Importeren (staalblauw pill, `download`-icoon, wit label) en Exporteren (pill met 1.5px inkt rand, `upload`-icoon, inkt label, hover #DAD5CA). Regel "Laatste import: 02-09-2026 · 1.248 regels · 3 overgeslagen".
- Kaart "ONDERDEEL · SKI & SNOWBOARD" met link "wijzig". Sectie "CATEGORIEËN" met subregel "Onderhoudsacties en eigen velden staan per categorie.": elke categorie is een uitklaprij (naam Archivo italic 800 15px, aantal stuks rechts 12px #8B9AA3, chevron die 90° roteert bij open; 1px #E7E3DA onderlijn). Eén categorie open tegelijk, Ski standaard open. Open toont twee blokken met pill-chips (radius 999px, rood kruisje om te verwijderen, gestippelde staalblauwe chip om toe te voegen):
  - "ONDERHOUDSACTIES" — chips vulling #F3F0E9, 1px #D8D3C8 rand, tekst #122028. Ski: Slijpen, Waxen, Binding controleren, Reparatie, Afkeuren · Snowboard: Waxen, Kanten bijwerken, Binding controleren, Reparatie, Afkeuren · Schoenen: Schoenmaat aanpassen, Clips controleren, Reinigen, Reparatie, Afkeuren · Helm: Reinigen, Schaal controleren, Afkeuren · Stokken: Lussen controleren, Reparatie, Afkeuren.
  - "EIGEN VELDEN" — chips vulling #E4E9EC, tekst #2E5470, met de velddefinities uit de lijst hierboven.
  Onderaan de kaart een gestippelde chip "categorie toevoegen". Aantallen per categorie: Ski 612, Snowboard 214, Schoenen 268, Helm 104, Stokken 50.
- Kaart "MEDEWERKERS" met link "+ nieuw": rijen met naam (14.5px, weight 500), rol (12px #8B9AA3), statusbadge Actief/Inactief (groene tint / neutrale #DAD5CA tint) en een 44×26 schakelaar (radius 999px, knop 20px wit; aan #3C9A5F, uit #C2BCB0). Tim Verhoeven — Beheerder · Ski & Snowboard — actief · Sanne de Groot — Medewerker · verhuurbalie — actief · Youssef El Amrani — Medewerker · werkplaats — actief · Bram Kuiper — Stagiair · werkplaats — inactief.

### 08 Nieuw materiaal
Bereikbaar via de oranje ronde "+"-knop rechts in het zoekveld van de materiaallijst (op desktop: de outline pill "Nieuw" in de topbalk) en via de kaart "Onbekend ID?" op het scanscherm. Teruglink "Terug naar materiaal", titel "Nieuw materiaal" + "Wordt toegevoegd aan {onderdeel}." Eén witte kaart met de velden, in deze volgorde:
- **Materiaal-ID** — tekstveld (placeholder "bv. SKI-1240"), hint "Moet exact overeenkomen met de QR-sticker." Handmatig invullen, niet automatisch genereren.
- **Categorie** — wrappende pills (Ski, Snowboard, Schoenen, Helm, Stokken), single select, default Ski.
- **Merk / model** — tekstveld (placeholder "bv. Rossignol Experience 78").
- **Locatie** — tekstveld (placeholder "bv. Rek A-03").
- **In gebruik sinds** — datumveld, default vandaag.
- Infoblok (#F3F0E9, radius 8px, 12.5px #566B76): "De eigen velden van de categorie (bij Ski: lengte, DIN-bereik, bindingtype, radius) vul je aan op het materiaalkaartje."

Geen statusveld: nieuw materiaal start op "In gebruik". Onderaan een oranje pill "Materiaal opslaan" (52px, check-icoon) die na opslaan naar het nieuwe materiaalkaartje gaat, en daaronder een outline pill "Annuleren". Tabbalk: Materiaal actief. Inputs: 48px, wit, 1px #D8D3C8, radius 8px.

### 09 Onderhoudslog
Tabbalk: Log actief. Zoekveld "Zoek op Materiaal-ID" (zelfde vorm als de materiaallijst). Daaronder een horizontaal scrollende rij filterpills met chevron-down: Categorie, Actie, Medewerker, Status na actie — elk opent een keuzelijst (wit, 1.5px #D8D3C8 rand, Archivo italic 800 11.5px uppercase #3C5260; actief filter krijgt de inkt-pill van de andere filters). Geen datumfilter.

Registraties chronologisch, gegroepeerd per dag met een kop in 11px uppercase #566B76 ("Vandaag · 13-09-2026", "Gisteren · 12-09-2026", "11-09-2026"). Elke groep is één witte kaart; per regel: Materiaal-ID (Archivo italic 800, 14.5px) + tijd (11.5px #8B9AA3), actie (13.5px #3C5260), medewerker (12px #8B9AA3), en rechts de statusbadge **alleen** als de registratie de status wijzigde. Rij is tikbaar naar het materiaalkaartje. Onderaan de lijst "531 registraties in de laatste 12 maanden."

Voorbeelddata: 13-09 SKI-0917 Binding controleren · Tim Verhoeven · 09:14 · → In reparatie · 13-09 HLM-0455 Reinigen · Sanne de Groot · 08:52 · 12-09 SCH-1104 Afkeuren · Tim Verhoeven · 16:38 · → Buiten gebruik · 12-09 SB-0231 Waxen · Youssef El Amrani · 14:05 · 12-09 SKI-1033 Slijpen · Youssef El Amrani · 13:20 · → In gebruik · 11-09 STK-0620 Lussen controleren · Sanne de Groot · 11:47 · 11-09 SKI-0842 Waxen · Sanne de Groot · 10:12.

### 10 Printen — QR-labels
Twee printweergaven, beide wit vel met gestippelde sniplijnen (#C2BCB0, 1px dashed, niet meeprinten).
- **Los label, 70 × 44 mm** (in het ontwerp 264 × 166 px): links de QR (104px, donker vlak radius 6px), rechts "OUTDOOR VALLEY" (11px uppercase #566B76), het Materiaal-ID (Archivo italic 800, 24px), merk/model + maat (12.5px #3C5260) en het onderdeel in oranje (#D9501C, 10px uppercase).
- **Printvel A4 (595 × 842 px), 12 labels in 3 × 4.** Velpadding 36px/30px. Kop: "MATERIAALLABELS · {ONDERDEEL}" links, "12 labels · datum" rechts (11px #8B9AA3). Elke cel: QR 58px links, ID (Archivo italic 800, 15px) en merk/model (10.5px) rechts, onderaan "OUTDOOR VALLEY · {ONDERDEEL}" (8.5px uppercase #8B9AA3). Cellen delen hun rand (negatieve marge) zodat er één doorlopend snijraster ontstaat.

Beide worden bereikt via de "printen"-link op het materiaalkaartje; het vel vult zich met de selectie uit de materiaallijst.

## Screens / Views — desktop (ontworpen op 1280×800)

Gedeelde shell:
- **Zijnavigatie** 232px, #122028, padding 20px 0. Bovenin merkblok: 34×34 oranje-omrand icoonvierkant + "MATERIAAL / ONDERHOUD" (Archivo italic 800, 13px, twee regels), met 1px #2F4350 onderrand. Navitems: pill (radius 999px, padding 11px 12px, icoon 18px + Archivo italic 700, 12.5px uppercase); actief = oranje vulling met witte tekst; inactief #8B9AA3 met hover #1B2C36 + witte tekst. Items: Scannen, Materiaal, Log, Overzicht, Beheer. Onderin (boven 1px #2F4350 rand): label "ONDERDEEL", "SKI & SNOWBOARD" in oranje, link "wissel van onderdeel".
- **Topbalk** 66px, wit, 1px #D8D3C8 onderrand, padding 0 24px.

Acht desktopweergaven: de vijf navitems, plus nieuw materiaal, inloggen en onderdeel kiezen (die drie hebben geen navitem). De hele desktopflow blijft binnen de desktoplay-out — "wissel van onderdeel" en uitloggen gaan naar de desktopversies van die schermen.

### D0 Inloggen
Twee kolommen zonder chrome. Links een donker paneel van 520px (#122028, padding 56px/48px): het oranje-omrande logovierkant bovenaan, onderaan "MATERIAAL / ONDERHOUD" (Archivo italic 800, 44px, wit) met de regel "Onderhoud aan verhuurmateriaal registreren via de QR-sticker op het materiaal." (15px #8B9AA3) en daaronder, boven een 1px #2F4350 rand, "OUTDOOR VALLEY" als kicker. Rechts op de zandgrond een gecentreerde witte kaart van 420px: titel "Inloggen" + "Met je Outdoor Valley medewerkersaccount.", de twee velden (48px, vulling #F3F0E9), de oranje pill "Inloggen" met pijl → onderdeel kiezen, en de regel over het wachtwoord.

### D0b Onderdeel kiezen
Donkere topbalk van 66px met het merkblok links en het gebruikersblok + uitlogknop rechts (geen zijnav: er is nog geen onderdeel gekozen). Content op de zandgrond, padding 40px/48px: titel "Kies een onderdeel" (30px) + "Alles wat je hierna doet valt onder dit onderdeel.", daaronder de vijf onderdelen in een grid van 3 kolommen. Elke kaart: 52px icoonvlak, naam (Archivo italic 800, 19px), aantal stuks, en onderaan de regel "KIES DIT ONDERDEEL" met pijl. Ski & Snowboard is uitgelicht met 2px #F4622B rand, oranje icoonvlak en oranje regel; de rest 1px #DAD5CA met staalblauw.

### D1 Scannen
Zijnav: Scannen actief. Topbalk: "SCANNEN" + "Houd de QR-sticker voor de camera of typ het Materiaal-ID".
Content: links de cameraviewer als flexibel vlak over de volle hoogte (zelfde donkere gradient en streeplaag als mobiel), met een 300 × 300 scanframe — hoekmarkeringen 44px, 4px oranje, **geen** hoekradius op desktop — en de oranje scanlijn met glow; onderin de gradientbalk "Webcam actief · richt op de QR-sticker". Rechts een kolom van 392px met drie kaarten:
1. "MATERIAAL-ID HANDMAAL" (label "Materiaal-ID handmatig"): invoerveld 46px + oranje pill-knop met pijl, hint "Het ID staat onder de QR-code op de sticker."
2. "ONBEKEND ID?": "Voeg het materiaal toe aan {onderdeel}." + outline pill "Nieuw materiaal" (plus-icoon) naar scherm 08.
3. "NET GESCAND": de laatste scans van deze sessie — ID, merk/model, tijd, chevron; klik → materiaalkaartje. Voorbeeld: SKI-0917 09:14 · HLM-0455 08:52 · SB-0231 08:41 · SKI-1033 08:23.

### D2 Materiaal + kaartje (master/detail)
Topbalk: zoekveld (40px, pill, max 420px, vulling #F3F0E9) · oranje pill-knop "QR scannen" (`scan-line`) · rechts gebruiker "Tim Verhoeven / Beheerder" + 36px ronde uitlogknop.
Content: links kolom 392px met 1px #D8D3C8 rechterrand — wrappende filterpills, resultaatregel, scrollende lijst met compacte kaarten (ID + categorie-pill, merk/model, statusbadge rechts, hover oranje rand). Rechts het materiaalkaartje: koprij met ID 32px, model, badges en 72px QR-mock met "printen"; specificaties in een **twee-koloms** grid binnen één witte kaart; daaronder naast elkaar het registratieformulier (flexibel breed, knop als inline oranje pill 46px) en de historiekaart (300px vast, oranje tijdlijnstippen).

### D3 Onderhoudslog
Zijnav: Log actief. Topbalk: titel "ONDERHOUDSLOG" + "531 registraties in de laatste 12 maanden", rechts knop "Exporteren" (outline pill) en gebruikersblok.
Content: filterrij bovenaan (zoekveld op Materiaal-ID, max 340px, pill; daarnaast de vier filterpills met chevron-down, 40px hoog, hover oranje rand). Daaronder één witte kaart met een echte tabel:
- Kopregel met 2px #122028 onderrand, labels Archivo italic 800 10.5px uppercase #566B76. Kolommen: Materiaal 120px · Categorie 150px · Actie flexibel · Medewerker 190px · Status na actie 150px · Tijd 70px rechts uitgelijnd.
- Dagkoppen als volle-breedte tussenrij (#F3F0E9, 1px #E7E3DA onderrand, zelfde labelstijl).
- Rijen: ID (Archivo italic 800, 14.5px), categorie-pill (staalblauw op #E4E9EC), actie 13.5px #122028, medewerker 13px #3C5260, statusbadge alleen bij statuswijziging, tijd 12.5px #8B9AA3. Rij hover #F3F0E9, klik → materiaalkaartje.

Dezelfde data als het mobiele logscherm; de categorie is op desktop een eigen kolom in plaats van impliciet.

### D4 Overzicht
Topbalk: titel "OVERZICHT" + bijgewerkt-regel, rechts knop "Exporteren" (outline pill) en gebruikersblok.
Content: vier statistiektegels in één rij (grid 4×1fr, cijfers 40px) · daaronder grid 1.15fr/1fr met links het staafdiagram "Onderhoud per actie" (190px hoog, staven tot 138px) en rechts "Per categorie" met 8px pill-balken · onderaan de volle-breedte tabel "Aandacht nodig" (ID 110px kolom, model flexibel, dagen-badge, chevron).

### D5 Nieuw materiaal
Zijnav: Materiaal actief (geen eigen navitem). Topbalk: "NIEUW MATERIAAL" + "Wordt toegevoegd aan {onderdeel}". Bereikbaar via de outline pill "Nieuw" in de topbalk van D2 en via de kaart "Onbekend ID?" op het scanscherm.
Content: teruglink "Terug naar materiaal", daaronder één witte kaart van max 820px met de velden in **twee kolommen** — links Materiaal-ID (met hint) en Merk/model, rechts In gebruik sinds en Locatie; Categorie als pill-rij over de volle breedte; daaronder het infoblok over de categorie-eigen velden. Onderaan naast elkaar de oranje pill "Materiaal opslaan" (check-icoon) en de outline pill "Annuleren", beide terug naar de materiaallijst. Zelfde velden en regels als scherm 08 op mobiel.

### D6 Beheer
Zijnav: Beheer actief. Topbalk: "BEHEER" + "Onderdeel Ski & Snowboard · alleen zichtbaar voor beheerders".
Content in een grid van 1.25fr / 1fr:
- Volle breedte bovenaan de **Excel**-kaart als één rij: label + "Laatste import: 02-09-2026 · 1.248 regels · 3 overgeslagen" links, de knoppen Importeren (staalblauwe pill) en Exporteren (outline pill) rechts.
- Links de **Categorieën**-kaart: identiek aan mobiel — uitklaprijen per categorie met de blokken "Onderhoudsacties" en "Eigen velden" als verwijderbare pill-chips, plus "categorie toevoegen".
- Rechts de **Medewerkers**-kaart (align-self: start): naam, rol, statusbadge en de 44 × 26 schakelaar per rij.

## Statussen, fouten en bevestigingen
Vier ontworpen toestanden, los op het canvas. Ze horen bij de schermen hierboven en gelden op mobiel en desktop.

- **Onbekend ID (scannen).** Het ID-veld krijgt een 1.5px #D64550 rand en #FBEAEC vulling, met eronder een rode regel + cirkel-icoon: "{ID} staat niet in {onderdeel}. Controleer het ID of voeg het materiaal toe." Daaronder de outline pill "Nieuw materiaal". Er wordt nooit automatisch doorgenavigeerd.
- **Geen zoekresultaten (materiaallijst).** Witte kaart, gecentreerd: search-icoon in #8B9AA3, kop "Geen materiaal gevonden" (Archivo italic 800, 17px), uitleg die zowel de zoekterm als het actieve onderdeel noemt, en twee acties: "Filter wissen" (outline) en "Nieuw" (oranje).
- **Offline.** Donkere melding (#122028) met doorgestreept wifi-icoon: "GEEN VERBINDING" in oranje + "Je kunt blijven scannen en registreren. Alles wordt verstuurd zodra de werkplaats weer bereik heeft." Daaronder een witte kaart "IN WACHTRIJ" met een oranje badge ({n} registraties) en de wachtende regels (ID, actie, tijd). Registreren blijft dus lokaal werken; de wachtrij loopt automatisch leeg bij verbinding. Dit is een eis, niet een extra: de werkplaats en de hal hebben slecht bereik.
- **Bevestiging bij verwijderen.** Modal van 420px op een #122028 55%-backdrop: rode kicker met waarschuwingsicoon, vraag als kop ("'Binding controleren' verwijderen uit Ski?"), uitleg over de gevolgen ("De 96 bestaande registraties blijven in het onderhoudslog staan en worden niet gewijzigd."), een grijs blok "Alleen beheerders kunnen dit. De wijziging wordt gelogd op naam van {medewerker}.", en de acties Annuleren (outline) + Verwijderen (#D64550, hover #B4323C, prullenbak-icoon). Hetzelfde patroon geldt voor categorie verwijderen, veld verwijderen en medewerker deactiveren.

### Eisen voor intern gebruik die dit ontwerp aanhoudt
- **Rollen.** Beheer is alleen zichtbaar voor beheerders; voor medewerkers verdwijnt het navitem (tabbalk krijgt dan vier cellen). Registreren mag iedereen, verwijderen en importeren niet.
- **Afkeuren gaat via goedkeuring door beheer.** Een medewerker kan afkeuren wel aanvragen, niet zelf doorvoeren. Kiest hij de actie "Afkeuren", dan verschijnt onder de actie-pills een staalblauw blok met slot-icoon: "Afkeuren moet worden goedgekeurd door beheer. Het materiaal komt op 'Ter goedkeuring' en blijft uit de verhuur tot een beheerder de afkeuring bevestigt." Het knoplabel wordt "Afkeuring aanvragen" (na opslaan "Afkeuring aangevraagd"). Het materiaal krijgt de status **Ter goedkeuring** en is daarmee niet verhuurbaar, maar ook niet definitief afgekeurd.
  In Beheer staat bovenaan (mobiel en desktop, met 3px oranje bovenrand en een badge "{n} open") de kaart **Afkeuringen ter goedkeuring**: per aanvraag het ID + merk/model, de opgegeven reden, "Aangevraagd door {medewerker} · {tijd}", en de acties **Goedkeuren** (#3C9A5F, hover #2F7B4C, check) en **Afwijzen** (outline #D64550, hover vulling #FBEAEC, kruis). Goedkeuren zet de status op Buiten gebruik; afwijzen zet hem terug op de vorige status. Beide beslissingen komen als eigen regel in het onderhoudslog, op naam van de beheerder. Voorbeelddata: SB-0119 Nitro Prime 152 cm (Youssef El Amrani, vandaag 08:36) en SCH-0761 Nordica Sportmachine maat 44 (Sanne de Groot, gisteren 15:02).
- **Naspoorbaarheid.** Elke registratie legt medewerker, datum en tijd vast en is onveranderlijk; correcties zijn een nieuwe registratie, geen bewerking. Beheerwijzigingen (acties, velden, medewerkers, imports) worden gelogd.
- **Nooit stille mislukking.** Onbekend ID, lege lijst en verbroken verbinding hebben allemaal een zichtbare, benoemde toestand met een uitweg.
- **Handschoenen en snelheid.** Raakvlakken minimaal 44px, primaire actie altijd binnen bereik, scannen is het startscherm, en het registratieformulier is in drie taps klaar (actie, opslaan).
- **Toetsenbord en focus.** Alles bedienbaar zonder muis, met de 2px oranje `:focus-visible` ring; op desktop is de zoek- en ID-invoer direct focusbaar.

## Tweede onderdeel: Mountainbike
Vier telefoonschermen (materiaal, materiaalkaartje, overzicht, beheer) en zes desktopweergaven (materiaal + kaartje, onderhoudslog, overzicht, scannen, beheer, nieuw materiaal) laten zien wat er per onderdeel verandert. De chrome, componenten en interacties zijn identiek aan Ski & Snowboard; alleen de accentkleur, de data en de configuratie verschillen. De desktopzijnav en topbalk zijn dezelfde shell, met Mountainbike als actief onderdeel en oranje als accent — de MTB-desktopflow blijft volledig binnen Mountainbike.

- **Header** toont "MOUNTAINBIKE" in oranje, met dezelfde "wissel van onderdeel"-link.
- **Categorieën:** MTB (48), E-MTB (12), Helm (18), Beschermers (8) — totaal 86 stuks, tegenover 1.248 bij Ski & Snowboard.
- **Onderhoudsacties per categorie:** MTB → Remmen controleren, Derailleur stellen, Ketting reinigen, Wielen centreren, Bandenspanning, Reparatie, Afkeuren · E-MTB → Remmen controleren, Derailleur stellen, Accu testen, Software bijwerken, Reparatie, Afkeuren · Helm → Reinigen, Schaal controleren, Afkeuren · Beschermers → Reinigen, Sluitingen controleren, Afkeuren.
- **Eigen velden per categorie:** MTB → Framemaat, Wielmaat, Versnellingen, Veerweg · E-MTB → Framemaat, Wielmaat, Motor, Accucapaciteit, Laadcycli · Helm → Maat, Productiejaar · Beschermers → Maat, Type. Het E-MTB-kaartje toont dus "Accucapaciteit 630 Wh · 78% resterend" en "Laadcycli 412" waar Ski een DIN-bereik heeft.
- **Voorbeelddata:** MTB-0142 Trek Marlin 7 maat M · MTB-0188 Cube Aim SL maat L (in reparatie, achterderailleur verbogen) · EMTB-0031 Haibike AllTrack 6 (het gedetailleerde kaartje) · MTB-0206 Giant Talon 3 maat S · HLM-2104 Bell Spark · BES-0455 Fox Launch kniebeschermers (buiten gebruik) · EMTB-0018 Focus Jam² maat L (ter goedkeuring).
- **Overzicht:** 86 totaal · 71 in gebruik · 9 in reparatie · 6 buiten gebruik; onderhoud per actie Remmen 96, Derailleur 74, Ketting 68, Accu 31, Afkeuren 5 (274 registraties).
- **Beheer:** zelfde opbouw, met één openstaande afkeuring (EMTB-0018, accu houdt 54% na 900 cycli) en "Laatste import: 28-08-2026 · 86 regels · 0 overgeslagen".

Navigatie in het prototype: de Mountainbike-kaart gaat op mobiel naar de MTB-materiaallijst en op desktop naar de MTB-desktopweergave; beide kaarten dragen de oranje accentkleur. Binnen de MTB-schermen blijft alle navigatie in Mountainbike. Op de mobiele MTB-schermen zijn "nieuw materiaal", "alles zien" en "printen" nog stubs (die schermen zijn alleen op desktop getekend); op desktop werkt de hele flow rond.

Conclusie voor de bouw: een onderdeel is puur configuratie (categorieën → acties + velddefinities). Er is geen aparte code per onderdeel nodig; Boogschieten, Klimmateriaal en Kano/Kajak/SUP volgen hetzelfde patroon.

## Interactions & Behavior
- **Login** → onderdeelkeuze. Geen echte authenticatie in het prototype; in de app: sessie + rolcheck (beheerder ziet Beheer).
- **Onderdeel kiezen** → scanscherm. Keuze wordt vastgehouden (sessie/localStorage) en filtert alle queries. "wissel van onderdeel" opent de keuzelijst opnieuw.
- **Scannen**: camerastream met QR-decoder; succesvolle scan navigeert direct naar het materiaalkaartje. Handmatig ID invoeren doet hetzelfde; onbekend ID → foutmelding onder het veld (rood #D64550, 12px), geen automatische doorverwijzing. Nieuw materiaal toevoegen gaat via de "+"-knop op de materiaallijst (scherm 08).
- **"Aandacht nodig"** = langer dan 9 maanden geen enkele onderhoudsactie geregistreerd (er is geen aparte "grote beurt"-actie meer).
- **Zoeken** filtert live op ID + merk/model (case-insensitive substring). **Filterpills** single-select, "Alles" reset. Zoek en filter werken gecombineerd; de resultaatregel toont beide.
- **Lijstkaart tikken** → detail.
- **Onderhoudsformulier**: actie verplicht (single select), opmerking vrij tekstveld, statuswijziging optioneel toggle. Opslaan voegt een historieregel toe (actie, datum/tijd, ingelogde medewerker, opmerking), werkt zo nodig de status en "laatste groot onderhoud" bij, en geeft bevestiging (in het prototype wijzigt het knoplabel naar "Onderhoud opgeslagen"; in de app: toast + formulier leegmaken + historie verversen).
- **Printen** opent het printbare QR-kaartje (ID + QR + merk/model).
- **Medewerkerschakelaar** activeert/deactiveert direct (optimistisch, met terugdraaien bij fout).
- **Excel import** vraagt een bestand, toont regelaantal en overgeslagen regels na verwerking; export downloadt de huidige selectie/scope.
- **Hover**: kaarten krijgen een zwaardere schaduw of oranje rand; oranje knoppen gaan naar #D9501C; zijnav-items naar #1B2C36.
- **Responsive**: één codebase. Onder ~900px de mobiele vorm (header + vaste tabbalk, volle-breedte kaarten, detail als eigen pagina). Vanaf ~900px de desktopvorm (zijnav, topbalk, master/detail naast elkaar, dashboardgrid). Tabbalk en zijnav zijn twee weergaven van dezelfde navigatie.
- Raakvlakken minimaal 44px op mobiel.

## State Management
- `session`: ingelogde medewerker (naam, rol).
- `activeOnderdeel`: gekozen onderdeel; bepaalt scope van alle lijsten, filters, acties en beheer.
- `zoek` (string) en `filterCategorie` (categorie of "Alles") voor de materiaallijst.
- `manualId` voor het handmatige scanalternatief.
- `openCat`: welke categorie in Beheer is uitgeklapt (één tegelijk).
- Detailformulier: `actie` (default "Reparatie", gekozen uit de acties van de categorie), `opmerking`, `statusWijziging` (nullable), `opgeslagen` (bevestigingsstatus).
- `medewerkers` met actief-vlag (optimistisch schakelen).
- Datavereisten: onderdelen met categorieën; per categorie een eigen set onderhoudsacties en een eigen set velddefinities; materiaal (ID, onderdeel, categorie, merk/model, locatie, status, in-gebruik-sinds, laatste groot onderhoud, aantal beurten) plus de waarden van de categorie-eigen velden (bijv. key/value of jsonb), onderhoudslogregels (materiaal, actie, datum, medewerker, opmerking, statuswijziging), medewerkers (naam, rol, actief), dashboard-aggregaties (per status, per categorie, per actie over 12 maanden, materiaal zonder groot onderhoud > 9 maanden).

## Assets
- Fonts: Archivo en Source Sans 3 via Google Fonts (zie Typografie).
- Iconen: **Lucide** line-iconen, inline SVG, stroke 1.7–2.1, geen fills, geen emoji. Gebruikt: scan-line, package, clipboard-list, bar-chart-3, settings, log-out, search, printer, chevron-right, chevron-left, arrow-right, check, plus, x, download, upload, alert-triangle, plus onderdeel-iconen (ski's — zelfgetekend uit twee afgeronde rechthoeken met bindingen en twee stokken —, bike, target, mountain/triangle, waves).
- Geen foto's in het prototype. Het logo is een placeholder-icoonvierkant; vervang door het echte Outdoor Valley merk.
- De stijl is overgenomen van de Outdoor Valley website (donkere inkt-chrome, zandkleurige grond, oranje acties, vet cursieve display-koppen). De sitekoppen gebruiken een eigen display-font; Archivo italic 800 is de benadering in dit prototype — vervang door de echte webfont als die beschikbaar is.

## Volgorde op het canvas
Eerst alle desktopweergaven, dan alle telefoonschermen, dan het gedeelde materiaal. Binnen elke groep staan de schermen in de volgorde waarin een medewerker ze doorloopt.
1. **Ski & Snowboard — desktop** (D01–D08): inloggen, onderdeel kiezen, scannen, materiaal + kaartje, nieuw materiaal, onderhoudslog, overzicht, beheer.
2. **Mountainbike — desktop** (MTB D01–D06): scannen, materiaal + kaartje, nieuw materiaal, onderhoudslog, overzicht, beheer.
3. **Ski & Snowboard — mobiel** (01–09): dezelfde flow op telefoonformaat.
4. **Mountainbike — mobiel** (MTB 01–04): materiaal, materiaalkaartje, overzicht, beheer.
5. **Printen — QR-labels**: los label en A4-printvel.
6. **Statussen, fouten en bevestigingen**: onbekend ID, geen resultaten, offline, verwijderbevestiging.

## Files
- `Materiaalonderhoud.dc.html` — alle schermen (8 desktopweergaven + 9 telefoonschermen + 2 printweergaven + 4 statussen/dialogen) op één canvas, met werkende zoek-, filter-, formulier- en schakelinteracties.
- `support.js` — runtime van de prototype-omgeving. Niet overnemen; alleen nodig om het HTML-bestand lokaal te bekijken.

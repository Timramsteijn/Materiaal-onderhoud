# Materiaalonderhoud — Outdoor Valley

Webapp om onderhoud aan verhuurmateriaal (ski's, snowboards, mountainbikes,
boogschieten, klimmateriaal, kano/kajak/SUP en andere categorieën) te
registreren via QR-scan, met een live gedeeld logboek voor alle medewerkers.
Eén responsieve codebase: mobiele vorm (header + tabbalk) onder ~900px,
desktopvorm (zijnavigatie + topbalk + materiaal-lijst/kaartje naast elkaar)
daarboven.

Gebaseerd op `Specificatie_materiaalonderhoud_app.md` en later herbouwd naar
het high-fidelity ontwerp uit `design_handoff_materiaalonderhoud/README.md`
— dit vervangt het eerdere prototype (los HTML-bestand met browser-opslag)
door een echte applicatie met een persistente Postgres-database en accounts
per medewerker.

## Techstack

- **Next.js 16** (App Router, Server Actions, Proxy voor route-bescherming)
- **PostgreSQL** via **Prisma ORM**
- **Auth.js / NextAuth v5** — inloggen met gebruikersnaam + wachtwoord
- **html5-qrcode** (scannen) / **qrcode** (genereren)
- **xlsx (SheetJS)** voor Excel-import/export
- Tailwind CSS v4 — Carter One (koppen en grote cijfers) + Figtree (lopende
  tekst én alle interface-tekst, labels en ID's), donkere navy chrome,
  crème kaartvlakken op een zandkleurige grond en één accentkleur per onderdeel, Lucide-iconen
  (`src/components/icons.tsx`)
- **PWA** met een IndexedDB-schrijfwachtrij, zodat registreren doorwerkt bij
  slecht bereik

## Datamodel (kort)

Kernregel: **een onderdeel is puur configuratie, geen eigen code.** Acties en
extra materiaalvelden hangen aan de *categorie*, niet aan het onderdeel — Ski
en Snowboard zitten in hetzelfde onderdeel en hebben tóch eigen actielijsten.
Een nieuw onderdeel toevoegen kost daarom alleen data: een onderdeelrij met
categorieën, acties en velddefinities.

- **Onderdeel**: bv. "Ski & Snowboard", "Mountainbike". Heeft een `slug` (de
  URL: `/ski-snowboard/...`) en een eigen accentkleur (`accent`,
  `accentPressed`, `accentTint`) die overal in dat onderdeel terugkomt.
- **Categorie**: een materiaalsoort binnen een onderdeel (Ski, Snowboard,
  E-MTB…), met een eigen set `OnderhoudsActie` en `VeldDefinitie`.
- **OnderhoudsActie**: naam + `isAfkeuren` (die actie start de goedkeuringsflow).
- **VeldDefinitie**: categorie-eigen materiaalveld (Lengte, DIN-bereik,
  Accucapaciteit…) met type en eenheid. De waarden staan als JSON op het
  materiaal, op velddefinitie-id.
- **Materiaal**: `materiaalId` zoals op de QR-sticker — handmatig ingevoerd,
  nooit gegenereerd, uniek binnen het onderdeel. Verder merk/model, locatie,
  status, in-gebruik-sinds, laatste onderhoud, aantal beurten en de
  veldwaarden.
- **LogRegel**: onveranderlijk. Bewaart een tekstkopie van actienaam en
  medewerkernaam, zodat archiveren of hernoemen de historie niet aantast.
  `clientId` is uniek en maakt de offline wachtrij idempotent.
- **Medewerker**: naam, gebruikersnaam, wachtwoord (gehasht), rol
  (`BEHEERDER` / `MEDEWERKER` / `STAGIAIR`) en functie.
- **BeheerLog**: auditspoor van beheerwijzigingen (acties, velden,
  medewerkers, imports).

### Rollen

Registreren mag iedereen. Alleen **beheerders** kunnen materiaal verwijderen,
Excel importeren, afkeuringen goedkeuren en medewerkers beheren — afgedwongen
in de server actions, niet alleen in de UI.

### Afkeuren gaat via goedkeuring

Een medewerker kan afkeuren wél aanvragen, niet doorvoeren. Kiest hij de
afkeuractie, dan komt het materiaal op **Ter goedkeuring**: uit de verhuur,
maar niet definitief afgekeurd. In Beheer staat de kaart "Afkeuringen ter
goedkeuring"; goedkeuren zet de status op Buiten gebruik, afwijzen zet hem
terug op de vorige status. Beide beslissingen komen als eigen regel in het
onderhoudslog, op naam van de beheerder.

### Offline

De werkplaats en de hal hebben slecht bereik, dus scannen en registreren
werken door zonder verbinding: schrijfacties gaan in een IndexedDB-wachtrij
(`src/lib/offline-queue.ts`) met een `clientId` per regel en worden idempotent
verstuurd zodra er weer bereik is. De app toont dan de melding "Geen
verbinding" en de kaart "In wachtrij"; een conflict blijft zichtbaar staan in
plaats van stil te verdwijnen.

## Lokaal draaien

Vereist: Node.js 22+, Docker (voor een lokale Postgres) of een eigen
Postgres-server.

```bash
cp .env.example .env
# vul AUTH_SECRET (openssl rand -base64 32) en SEED_ADMIN_WACHTWOORD in

docker compose up -d db        # start alleen de database
npm install
npx prisma migrate dev          # database-schema aanmaken
npm run db:seed                 # onderdelen, categorieën, acties, velden en accounts
npm run dev
```

Open <http://localhost:3000>. Het seed-script maakt vier accounts aan, allemaal
met het wachtwoord uit `SEED_ADMIN_WACHTWOORD`: `t.verhoeven` (beheerder),
`s.degroot` en `y.elamrani` (medewerkers) en `b.kuiper` (stagiair, inactief).
Wijzig deze wachtwoorden vóór productiegebruik.

## Omgevingsvariabelen

Zie `.env.example`. Belangrijkste:

- `DATABASE_URL` — Postgres-connectiestring.
- `AUTH_SECRET` — geheim voor sessie-encryptie (`openssl rand -base64 32`).
- `AUTH_URL` — de volledige URL waarop de app in productie draait.
- `SEED_ADMIN_WACHTWOORD` — wachtwoord voor de accounts die het seed-script
  aanmaakt.

## Ontwerp

De UI volgt `design_handoff_materiaalonderhoud/` (in deze repo):
`CLAUDE_CODE_PROMPT.md` §4 bevat de leidende design tokens, `README.md` de
schermspecificaties en copy, en `Materiaalonderhoud.dc.html` de klikbare
mockup. De tokens staan als CSS-variabelen in `src/app/globals.css`; het
accent per onderdeel wordt gezet in `src/lib/accent.ts` en via
`var(--accent)` gebruikt — nooit een kleur hard in een component.

Eén responsieve codebase: onder ~900px de mobiele vorm (navy header + vaste
tabbalk, detail als eigen pagina), daarboven de desktopvorm (232px zijnav,
66px topbalk, master/detail naast elkaar).

## Hosten / deployen

De app is bewust hostingklaar gemaakt zonder vendor lock-in (zie sectie 6.1
van de specificatie — dit was nog een open vraag). Twee opties:

### Optie A — Docker Compose op een eigen server/VPS

```bash
cp .env.example .env   # AUTH_URL invullen met het echte domein
docker compose up -d --build
```

Dit start zowel de Postgres-database (met een volume, dus persistent) als de
app. Bij het opstarten voert de app automatisch database-migraties uit en
zorgt het seed-script dat de onderdelen, categorieën, acties, velddefinities
en accounts bestaan (idempotent, dus veilig bij elke herstart).

Zet er een reverse proxy (bv. Caddy of nginx) voor met een echt domein en
TLS, bijvoorbeeld `onderhoud.outdoorvalley.nl`.

### Optie B — Vercel (of vergelijkbaar) + managed Postgres

De app bouwt met `output: "standalone"` en heeft geen Vercel-specifieke code
— hij werkt op elk platform dat een Node.js-server kan draaien. Voor Vercel:
koppel een managed Postgres (bv. Neon, Supabase, of Vercel Postgres), zet de
omgevingsvariabelen, en draai migraties + seed als build-/postdeploy-stap
(`npx prisma migrate deploy && npm run db:seed`).

### Website-integratie

De app zet geen `X-Frame-Options`/CSP-frame-ancestors header, dus is
standaard inbedbaar via `<iframe>` op de bestaande Outdoor Valley-website.
Hij is ook direct te bezoeken en als PWA aan het beginscherm toe te voegen
(`manifest.json` + iconen zijn aanwezig). Welke combinatie precies gewenst
is (los subdomein, iframe, of beide) stond nog open in de specificatie —
technisch kan het allebei zonder aanpassingen.

## Excel-import/export

Via **Beheer** kan het volledige materiaal + logboek als `.xlsx`
geëxporteerd worden (tabbladen "Materiaal" en "Onderhoudslog"), en kan een
Excel-bestand met diezelfde structuur weer geïmporteerd worden (upsert op
Materiaal-ID; categorie wordt gematcht op naam). Dit is alleen beschikbaar
voor duty managers.

## Bekende beperkingen

- De `xlsx`-bibliotheek (SheetJS) heeft op dit moment npm-registry
  advisories (prototype pollution / ReDoS) zonder officiële fix op npm; de
  aanbevolen mitigatie (installeren vanaf `cdn.sheetjs.com`) was in deze
  omgeving niet bereikbaar. Het risico is beperkt omdat import alleen
  toegankelijk is voor ingelogde duty managers die hun eigen bestand
  uploaden — geen publiek input-pad. Overweeg dit te herzien voor
  productie (bv. alsnog installeren vanaf de officiële CDN, of een bestand-
  groottelimiet + sandboxed parsing toevoegen).
- De "laatste import"-regel op de Beheer-pagina toont alleen het resultaat
  van de import in de huidige sessie (via de redirect na upload), niet een
  permanent opgeslagen importgeschiedenis.

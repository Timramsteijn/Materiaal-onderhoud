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
- Tailwind CSS v4 — Archivo (italic, koppen/labels/cijfers) + Source Sans 3
  (lopende tekst), donkere inkt-chrome + zandkleurige grond + oranje acties,
  Lucide-iconen (inline SVG, `src/components/icons.tsx`)

## Datamodel (kort)

- **Department (onderdeel)**: een bedrijfsonderdeel/activiteit, bv. "Ski &
  Snowboard", "Mountainbike", "Boogschieten", "Klimmateriaal",
  "Kano & Kajak & SUP". Medewerkers kiezen na het inloggen een onderdeel om
  mee te werken (`/onderdeel`); alles daarna (scannen, materiaal, log,
  overzicht) is gescoped tot dat onderdeel. Nieuwe onderdelen voegt een duty
  manager toe via **Beheer** — geen nieuwe build nodig.
- **Category**: een materiaalsoort binnen een onderdeel (bv. Ski, Snowboard),
  met naam, prefix (voor materiaal-ID's, bv. `SKI`), een eigen lijst
  onderhoudsacties en een optioneel extra specificatieveld (`extraVeldLabel`,
  bv. "DIN" bij Ski) voor categorie-specifieke velden.
- **Material**: het materiaal-ID (uniek over alle onderdelen/categorieën
  heen — dit voorkomt scanverwarring en laat een scan altijd naar het juiste
  onderdeel navigeren, ook als je in een ander onderdeel aan het scannen
  was), categorie, merk, model, maat, aanschafjaar, status, opmerkingen,
  locatie, in-gebruik-sinds en de waarde van het extra specificatieveld.
- **MaintenanceLog**: datum, materiaal, actie, wie (account), opmerkingen,
  eventuele nieuwe status.
- **User**: naam, gebruikersnaam, wachtwoord (gehasht), rol
  (`INSTRUCTEUR` / `DUTY_MANAGER`).

### Rollen

Iedereen kan scannen, onderhoud registreren en materiaal toevoegen/bewerken.
Alleen **duty managers** kunnen: materiaal definitief verwijderen, materiaal
afkeuren ("Buiten gebruik / afgekeurd"), onderdelen/categorieën/onderhoudsacties
beheren, en medewerkeraccounts aanmaken/deactiveren.

## Lokaal draaien

Vereist: Node.js 22+, Docker (voor een lokale Postgres) of een eigen
Postgres-server.

```bash
cp .env.example .env
# vul AUTH_SECRET (openssl rand -base64 32) en SEED_ADMIN_WACHTWOORD in

docker compose up -d db        # start alleen de database
npm install
npx prisma migrate dev          # database-schema aanmaken
npm run db:seed                 # categorieën Ski/Snowboard + eerste account "beheer"
npm run dev
```

Open <http://localhost:3000> — log in met gebruikersnaam `beheer` en het
wachtwoord uit `SEED_ADMIN_WACHTWOORD`. Wijzig dit wachtwoord na de eerste
keer inloggen (via een nieuw account aanmaken en het beheeraccount
deactiveren, of pas het rechtstreeks in de database aan).

## Omgevingsvariabelen

Zie `.env.example`. Belangrijkste:

- `DATABASE_URL` — Postgres-connectiestring.
- `AUTH_SECRET` — geheim voor sessie-encryptie (`openssl rand -base64 32`).
- `AUTH_URL` — de volledige URL waarop de app in productie draait.
- `SEED_ADMIN_WACHTWOORD` — wachtwoord voor het eerste account dat het
  seed-script aanmaakt (gebruikersnaam `beheer`, rol duty manager).

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
zorgt het seed-script dat de standaardcategorieën en het eerste
duty-manager-account bestaan (idempotent, dus veilig bij elke herstart).

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

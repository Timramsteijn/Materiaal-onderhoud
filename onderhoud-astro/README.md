# Materiaalonderhoud — Outdoor Valley

Interne webapp waarmee medewerkers onderhoud aan verhuurmateriaal registreren:
QR-sticker scannen, actie kiezen, klaar. Gebouwd met **Astro** en draait op
**Cloudflare Workers** met **D1** (database) en **KV** (sessies).

---

## Waar draait dit, en hoe verhoudt het zich tot de hoofdsite?

De app is een **eigen Astro-project op een eigen subdomein**:
`onderhoud.outdoorvalley.nl`. Dat is een bewuste keuze:

- De hoofdsite is publiek en grotendeels statisch; deze app zit volledig achter
  een login en rendert elk verzoek op de server. Eén codebase zou die twee
  regimes door elkaar halen (caching, middleware, sessies).
- De app heeft een D1-database en KV-sessies nodig. Losse Workers houden die
  bindings — en het risico bij een deploy — gescheiden van de website.
- Een eigen subdomein maakt de QR-codes stabiel: die bevatten de absolute URL
  van het materiaalkaartje en moeten jaren geldig blijven.

Wel is alles zo opgezet dat het later in één monorepo kan:

- De huisstijl staat in `src/styles/globals.css` als tokens. Dat bestand kan
  zonder aanpassing een gedeeld pakket worden (`@outdoorvalley/tokens`).
- Er zit geen padafhankelijkheid buiten deze map; verplaatsen naar
  `apps/onderhoud/` vergt geen codewijziging, alleen een workspace-regel.
- De routes zitten allemaal onder `/{onderdeel-slug}/…`, dus als de app ooit
  tóch als pad onder de hoofdsite moet (`outdoorvalley.nl/onderhoud`), is een
  prefix genoeg.

---

## Lokaal draaien

```bash
npm install

# Database aanmaken en vullen (lokale D1 in .wrangler/state)
npm run db:migrate
SEED_ADMIN_WACHTWOORD='kies-een-wachtwoord' npm run seed

npm run dev          # http://localhost:4321
```

Op Windows (CMD) zet je die variabele apart, want de regel hierboven is
bash-syntax:

```
npm install
npm run db:migrate
set SEED_ADMIN_WACHTWOORD=kies-een-wachtwoord
npm run seed
npm run dev
```

`npm run dev` blijft draaien zolang het venster openstaat; stoppen doe je met
Ctrl+C. Wil je met schone gegevens opnieuw beginnen, verwijder dan de map
`.wrangler` en draai `db:migrate` en `seed` nog eens.

### Het inlogscherm overslaan tijdens ontwikkelen

Kopieer `.env.voorbeeld` naar `.env` en je werkt meteen als de medewerker die
daarin staat:

```
ONTWIKKEL_INLOG=t.verhoeven
```

Dit werkt alleen met `npm run dev`. In een productiebuild wordt de hele
opzoeking tot `return null` gecompileerd, dus hij kan daar niet aanstaan — ook
niet als de variabele op de server gezet zou worden. `.env` staat in
`.gitignore`; weghalen zet de gewone login terug.

De seed maakt vier accounts aan, allemaal met het wachtwoord uit
`SEED_ADMIN_WACHTWOORD`:

| Gebruikersnaam | Rol        |
| -------------- | ---------- |
| `t.verhoeven`  | Beheerder  |
| `s.degroot`    | Medewerker |
| `y.elamrani`   | Medewerker |
| `b.kuiper`     | Stagiair (inactief) |

Andere scripts:

```bash
npm run build            # productiebuild (dist/)
npm run preview          # de gebouwde worker lokaal draaien
npm run check            # typecontrole van .astro/.ts/.tsx
npm run e2e              # end-to-end tests (dev-server moet draaien)
npm run db:generate      # nieuwe migratie uit src/db/schema.ts
```

> `astro check` heeft TypeScript 6 nodig; TypeScript 7 (de native compiler)
> levert de API die de checker gebruikt nog niet. Daarom staat `typescript`
> hier op `6.x` vastgezet.

---

## Deployen naar Cloudflare

1. **Aanmelden en project koppelen**

   ```bash
   npx wrangler login
   ```

2. **D1-database aanmaken**

   ```bash
   npx wrangler d1 create onderhoud
   ```

   Zet het teruggegeven `database_id` in `wrangler.jsonc` in plaats van
   `local-dev`.

3. **KV-namespace voor de sessies aanmaken**

   ```bash
   npx wrangler kv namespace create SESSION
   ```

   Zet het teruggegeven `id` in `wrangler.jsonc` bij `kv_namespaces`.

4. **Migraties uitvoeren op de echte database**

   ```bash
   npm run db:migrate:remote
   ```

5. **Seeden** (alleen de eerste keer; het script is idempotent)

   ```bash
   SEED_ADMIN_WACHTWOORD='...' npm run seed:remote
   ```

6. **Bouwen en uitrollen**

   ```bash
   npm run build
   npx wrangler deploy
   ```

7. **Subdomein koppelen** — in het Cloudflare-dashboard bij de Worker onder
   *Settings → Domains & Routes* `onderhoud.outdoorvalley.nl` toevoegen. De
   DNS-record wordt automatisch aangemaakt als het domein in dit account zit.

Er zijn geen secrets nodig: de app gebruikt geen externe diensten.
`SEED_ADMIN_WACHTWOORD` wordt alleen bij het seeden gebruikt en nergens
opgeslagen — wachtwoorden staan als PBKDF2-hash in de database.

---

## Hoe het in elkaar zit

```
src/
  actions/      Astro Actions: alle mutaties, met rolcontrole
  components/   React-eilanden en gedeelde UI
  db/           Drizzle-schema (D1/SQLite)
  layouts/      Basis.astro (document) en Onderdeel.astro (app-shell)
  lib/          domeinlogica, queries, accent, offline wachtrij, Excel
  pages/        routes, API-endpoints en printweergaven
  middleware.ts login-gate; zet de medewerker in locals
drizzle/        migraties
scripts/        seed
e2e/            end-to-end tests
```

### Onderdelen zijn configuratie, geen code

Een onderdeel (Ski & Snowboard, Mountainbike, …) bestaat uit databaserijen:
categorieën, en per categorie een eigen lijst onderhoudsacties en eigen
materiaalvelden. Een nieuw onderdeel toevoegen vraagt dus geen code.

De accentkleur van een onderdeel wordt als CSS-variabelen op de shell gezet
(`src/lib/accent.ts`). Componenten verwijzen alleen naar `var(--accent)` c.s.;
er staat nergens een kleur hard in een component en nergens een
`if (onderdeel === …)`. `--accent-on` wordt uit de luminantie afgeleid, zodat
een licht accent navy tekst krijgt en een donker accent crème.

### Afkeuren loopt via goedkeuring

Kiest een medewerker een actie die als `isAfkeuren` staat gemarkeerd, dan gaat
het materiaal naar **Ter goedkeuring** en blijft het uit de verhuur. Een
beheerder bevestigt (→ Buiten gebruik) of wijst af (→ terug naar de vorige
status). De vorige status staat in `statusVoorKeuring`, zodat afwijzen precies
terugdraait.

### Logregels zijn onveranderlijk

Een correctie is een nieuwe registratie, geen bewerking. Actienaam en
medewerkersnaam staan als tekstkopie in de logregel, zodat archiveren van een
actie of medewerker de historie niet verandert. Verwijderen is overal
archiveren (`archivedAt`); beheerwijzigingen komen in `beheerlog`.

### Offline blijven werken

De werkplaats heeft slecht bereik. Registraties gaan zonder verbinding in een
IndexedDB-wachtrij (`src/lib/offline-queue.ts`) en worden verstuurd zodra er
weer bereik is. Elke registratie draagt een `clientId`; de server dedupliceert
daarop, dus opnieuw versturen levert nooit een dubbele regel op.

### Zonder JavaScript

Elk formulier post naar dezelfde Astro Action als de JavaScript-variant, dus
inloggen, registreren en beheren blijven werken als een eiland niet hydrateert.
Alleen de camera-scanner heeft JavaScript echt nodig; daar staat handmatige
invoer naast.

### QR-codes

De QR bevat de **volledige URL** van het materiaalkaartje, zodat een scan met
de gewone telefooncamera ook buiten de app uitkomt op de juiste plek. Codes
worden als SVG gegenereerd (`src/lib/qr.ts`) — geen Node-afhankelijkheden, dus
ze werken gewoon op Workers.

---

## Excel

- `GET /api/export?onderdeel=<slug>` — werkboek met de tabbladen *Materiaal* en
  *Onderhoudslog*; categorie-eigen velden krijgen een eigen kolom
  (`{Categorie} · {Veld}`), zodat dezelfde export weer importeerbaar is.
- `POST /api/import?onderdeel=<slug>` — alleen beheerders, max 5 MB. Elke regel
  wordt apart gevalideerd: een fout in regel 14 laat de rest doorlopen. De
  reden per overgeslagen regel komt terug op de beheerpagina.

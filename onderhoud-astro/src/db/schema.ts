import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

/*
 * D1 is SQLite: geen enums en geen json-kolomtype. Enums worden tekstkolommen
 * met een union-type (Drizzle dwingt het type af, een CHECK-constraint de
 * database), datums worden integer-timestamps en veldwaarden worden JSON-tekst.
 */

export const ROLLEN = ["BEHEERDER", "MEDEWERKER", "STAGIAIR"] as const;
export type Rol = (typeof ROLLEN)[number];

export const STATUSSEN = [
  "IN_GEBRUIK",
  "IN_REPARATIE",
  "BUITEN_GEBRUIK",
  "TER_GOEDKEURING",
] as const;
export type Status = (typeof STATUSSEN)[number];

export const VELDTYPES = ["TEKST", "GETAL", "BEREIK", "DATUM", "KEUZE"] as const;
export type VeldType = (typeof VELDTYPES)[number];

/**
 * Een melding "dit moet gebeuren" leeft los van de registratie "dit is
 * gebeurd". Anders telt hetzelfde slijpbeurtje twee keer mee in het log.
 */
export const VERZOEKSTATUSSEN = ["OPEN", "AFGEROND", "VERVALLEN"] as const;
export type VerzoekStatus = (typeof VERZOEKSTATUSSEN)[number];

export const LOGSOORTEN = [
  "REGISTRATIE",
  "AFKEURING_AANGEVRAAGD",
  "AFKEURING_GOEDGEKEURD",
  "AFKEURING_AFGEWEZEN",
] as const;
export type LogSoort = (typeof LOGSOORTEN)[number];

export const medewerkers = sqliteTable("medewerkers", {
  id: text("id").primaryKey(),
  naam: text("naam").notNull(),
  gebruikersnaam: text("gebruikersnaam").notNull().unique(),
  /** PBKDF2-hash via Web Crypto — bcrypt is te traag op Workers. */
  wachtwoordHash: text("wachtwoord_hash").notNull(),
  rol: text("rol", { enum: ROLLEN }).notNull().default("MEDEWERKER"),
  /** Vrije tekst, bv. "Beheerder · Ski & Snowboard" */
  functie: text("functie").notNull().default(""),
  actief: integer("actief", { mode: "boolean" }).notNull().default(true),
  aangemaakt: integer("aangemaakt", { mode: "timestamp_ms" }).notNull(),
});

/**
 * Een bedrijfsonderdeel. Puur configuratie: categorieën bepalen de acties en
 * velden, dus een nieuw onderdeel toevoegen kost geen code.
 */
export const onderdelen = sqliteTable("onderdelen", {
  id: text("id").primaryKey(),
  naam: text("naam").notNull().unique(),
  slug: text("slug").notNull().unique(),
  /** Accentkleur van dit onderdeel; overal via CSS-variabelen doorgevoerd. */
  accent: text("accent").notNull(),
  accentPressed: text("accent_pressed").notNull(),
  accentTint: text("accent_tint").notNull(),
  icoon: text("icoon").notNull(),
  uitgelicht: integer("uitgelicht", { mode: "boolean" }).notNull().default(false),
  sortering: integer("sortering").notNull().default(0),
  /** Toont een aantal op het keuzescherm zolang er nog geen materiaal in staat. */
  aantalIndicatie: integer("aantal_indicatie").notNull().default(0),
});

export const categorieen = sqliteTable(
  "categorieen",
  {
    id: text("id").primaryKey(),
    onderdeelId: text("onderdeel_id")
      .notNull()
      .references(() => onderdelen.id, { onDelete: "cascade" }),
    naam: text("naam").notNull(),
    sortering: integer("sortering").notNull().default(0),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    uniqueIndex("categorie_onderdeel_naam").on(t.onderdeelId, t.naam),
    index("categorie_onderdeel").on(t.onderdeelId),
  ]
);

/**
 * Onderhoudsacties horen bij een categorie, niet bij het onderdeel: Ski en
 * Snowboard zitten in hetzelfde onderdeel en hebben tóch eigen actielijsten.
 */
export const onderhoudsacties = sqliteTable(
  "onderhoudsacties",
  {
    id: text("id").primaryKey(),
    categorieId: text("categorie_id")
      .notNull()
      .references(() => categorieen.id, { onDelete: "cascade" }),
    naam: text("naam").notNull(),
    /** Markeert de actie die de goedkeuringsflow start. */
    isAfkeuren: integer("is_afkeuren", { mode: "boolean" }).notNull().default(false),
    sortering: integer("sortering").notNull().default(0),
    /** Verwijderen = archiveren; bestaande logregels blijven ongemoeid. */
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("actie_categorie").on(t.categorieId)]
);

/** Per categorie eigen materiaalvelden (Ski heeft DIN-bereik, E-MTB een accu). */
export const velddefinities = sqliteTable(
  "velddefinities",
  {
    id: text("id").primaryKey(),
    categorieId: text("categorie_id")
      .notNull()
      .references(() => categorieen.id, { onDelete: "cascade" }),
    naam: text("naam").notNull(),
    type: text("type", { enum: VELDTYPES }).notNull().default("TEKST"),
    eenheid: text("eenheid"),
    /** JSON-array met keuzes; alleen gevuld bij type KEUZE. */
    opties: text("opties").notNull().default("[]"),
    sortering: integer("sortering").notNull().default(0),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("veld_categorie").on(t.categorieId)]
);

export const materiaal = sqliteTable(
  "materiaal",
  {
    id: text("id").primaryKey(),
    /** Zoals op de QR-sticker; handmatig ingevoerd, nooit gegenereerd. */
    materiaalId: text("materiaal_id").notNull(),
    onderdeelId: text("onderdeel_id")
      .notNull()
      .references(() => onderdelen.id),
    categorieId: text("categorie_id")
      .notNull()
      .references(() => categorieen.id),
    merkModel: text("merk_model").notNull(),
    locatie: text("locatie").notNull().default(""),
    status: text("status", { enum: STATUSSEN }).notNull().default("IN_GEBRUIK"),
    /** Status waarnaar teruggedraaid wordt als een afkeuring wordt afgewezen. */
    statusVoorKeuring: text("status_voor_keuring", { enum: STATUSSEN }),
    inGebruikSinds: integer("in_gebruik_sinds", { mode: "timestamp_ms" }).notNull(),
    laatsteOnderhoud: integer("laatste_onderhoud", { mode: "timestamp_ms" }),
    aantalBeurten: integer("aantal_beurten").notNull().default(0),
    /** JSON-object: { velddefinitieId: waarde } */
    veldwaarden: text("veldwaarden").notNull().default("{}"),
    aangemaakt: integer("aangemaakt", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    uniqueIndex("materiaal_onderdeel_id").on(t.onderdeelId, t.materiaalId),
    index("materiaal_categorie").on(t.categorieId),
  ]
);

/** Onveranderlijk: een correctie is een nieuwe registratie, geen bewerking. */
export const logregels = sqliteTable(
  "logregels",
  {
    id: text("id").primaryKey(),
    materiaalDbId: text("materiaal_db_id")
      .notNull()
      .references(() => materiaal.id, { onDelete: "cascade" }),
    /** Tekstkopie, blijft staan als de actie wordt gearchiveerd. */
    actieNaam: text("actie_naam").notNull(),
    actieId: text("actie_id"),
    opmerking: text("opmerking").notNull().default(""),
    /** Alleen gevuld als deze registratie de status wijzigde. */
    statusNa: text("status_na", { enum: STATUSSEN }),
    medewerkerId: text("medewerker_id")
      .notNull()
      .references(() => medewerkers.id),
    medewerkerNaam: text("medewerker_naam").notNull(),
    tijdstip: integer("tijdstip", { mode: "timestamp_ms" }).notNull(),
    soort: text("soort", { enum: LOGSOORTEN }).notNull().default("REGISTRATIE"),
    /** Idempotentie voor de offline wachtrij. */
    clientId: text("client_id").notNull().unique(),
  },
  (t) => [index("log_materiaal").on(t.materiaalDbId), index("log_tijdstip").on(t.tijdstip)]
);

/**
 * Gemeld onderhoud: een instructeur ziet dat er iets moet gebeuren, de
 * werkplaats voert het uit. Bewust geen logregel — pas de registratie van het
 * uitgevoerde onderhoud komt in het log en telt mee in de cijfers.
 */
export const onderhoudsverzoeken = sqliteTable(
  "onderhoudsverzoeken",
  {
    id: text("id").primaryKey(),
    materiaalDbId: text("materiaal_db_id")
      .notNull()
      .references(() => materiaal.id, { onDelete: "cascade" }),
    /** Tekstkopie, blijft staan als de actie later wordt gearchiveerd. */
    actieNaam: text("actie_naam").notNull(),
    actieId: text("actie_id"),
    opmerking: text("opmerking").notNull().default(""),
    status: text("status", { enum: VERZOEKSTATUSSEN }).notNull().default("OPEN"),
    gemeldDoorId: text("gemeld_door_id")
      .notNull()
      .references(() => medewerkers.id),
    gemeldDoorNaam: text("gemeld_door_naam").notNull(),
    gemeldOp: integer("gemeld_op", { mode: "timestamp_ms" }).notNull(),
    afgehandeldDoorNaam: text("afgehandeld_door_naam"),
    afgehandeldOp: integer("afgehandeld_op", { mode: "timestamp_ms" }),
    /** De registratie waarmee dit verzoek is afgerond; leeg bij vervallen. */
    logregelId: text("logregel_id"),
    /** Idempotentie, net als bij logregels. */
    clientId: text("client_id").notNull().unique(),
  },
  (t) => [
    index("verzoek_materiaal").on(t.materiaalDbId),
    index("verzoek_status").on(t.status),
  ]
);

/** Auditspoor van beheerwijzigingen: acties, velden, medewerkers, imports. */
export const beheerlog = sqliteTable(
  "beheerlog",
  {
    id: text("id").primaryKey(),
    medewerkerId: text("medewerker_id")
      .notNull()
      .references(() => medewerkers.id),
    wat: text("wat").notNull(),
    /** JSON-object met de details van de wijziging. */
    detail: text("detail").notNull().default("{}"),
    tijdstip: integer("tijdstip", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("beheerlog_tijdstip").on(t.tijdstip)]
);

export type Onderdeel = typeof onderdelen.$inferSelect;
export type Onderhoudsverzoek = typeof onderhoudsverzoeken.$inferSelect;
export type Categorie = typeof categorieen.$inferSelect;
export type OnderhoudsActie = typeof onderhoudsacties.$inferSelect;
export type VeldDefinitie = typeof velddefinities.$inferSelect;
export type Materiaal = typeof materiaal.$inferSelect;
export type LogRegel = typeof logregels.$inferSelect;
export type Medewerker = typeof medewerkers.$inferSelect;

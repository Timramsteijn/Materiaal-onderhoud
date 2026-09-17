CREATE TABLE `beheerlog` (
	`id` text PRIMARY KEY NOT NULL,
	`medewerker_id` text NOT NULL,
	`wat` text NOT NULL,
	`detail` text DEFAULT '{}' NOT NULL,
	`tijdstip` integer NOT NULL,
	FOREIGN KEY (`medewerker_id`) REFERENCES `medewerkers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `beheerlog_tijdstip` ON `beheerlog` (`tijdstip`);--> statement-breakpoint
CREATE TABLE `categorieen` (
	`id` text PRIMARY KEY NOT NULL,
	`onderdeel_id` text NOT NULL,
	`naam` text NOT NULL,
	`sortering` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`onderdeel_id`) REFERENCES `onderdelen`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categorie_onderdeel_naam` ON `categorieen` (`onderdeel_id`,`naam`);--> statement-breakpoint
CREATE INDEX `categorie_onderdeel` ON `categorieen` (`onderdeel_id`);--> statement-breakpoint
CREATE TABLE `logregels` (
	`id` text PRIMARY KEY NOT NULL,
	`materiaal_db_id` text NOT NULL,
	`actie_naam` text NOT NULL,
	`actie_id` text,
	`opmerking` text DEFAULT '' NOT NULL,
	`status_na` text,
	`medewerker_id` text NOT NULL,
	`medewerker_naam` text NOT NULL,
	`tijdstip` integer NOT NULL,
	`soort` text DEFAULT 'REGISTRATIE' NOT NULL,
	`client_id` text NOT NULL,
	FOREIGN KEY (`materiaal_db_id`) REFERENCES `materiaal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`medewerker_id`) REFERENCES `medewerkers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `logregels_client_id_unique` ON `logregels` (`client_id`);--> statement-breakpoint
CREATE INDEX `log_materiaal` ON `logregels` (`materiaal_db_id`);--> statement-breakpoint
CREATE INDEX `log_tijdstip` ON `logregels` (`tijdstip`);--> statement-breakpoint
CREATE TABLE `materiaal` (
	`id` text PRIMARY KEY NOT NULL,
	`materiaal_id` text NOT NULL,
	`onderdeel_id` text NOT NULL,
	`categorie_id` text NOT NULL,
	`merk_model` text NOT NULL,
	`locatie` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'IN_GEBRUIK' NOT NULL,
	`status_voor_keuring` text,
	`in_gebruik_sinds` integer NOT NULL,
	`laatste_onderhoud` integer,
	`aantal_beurten` integer DEFAULT 0 NOT NULL,
	`veldwaarden` text DEFAULT '{}' NOT NULL,
	`aangemaakt` integer NOT NULL,
	FOREIGN KEY (`onderdeel_id`) REFERENCES `onderdelen`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categorie_id`) REFERENCES `categorieen`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `materiaal_onderdeel_id` ON `materiaal` (`onderdeel_id`,`materiaal_id`);--> statement-breakpoint
CREATE INDEX `materiaal_categorie` ON `materiaal` (`categorie_id`);--> statement-breakpoint
CREATE TABLE `medewerkers` (
	`id` text PRIMARY KEY NOT NULL,
	`naam` text NOT NULL,
	`gebruikersnaam` text NOT NULL,
	`wachtwoord_hash` text NOT NULL,
	`rol` text DEFAULT 'MEDEWERKER' NOT NULL,
	`functie` text DEFAULT '' NOT NULL,
	`actief` integer DEFAULT true NOT NULL,
	`aangemaakt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `medewerkers_gebruikersnaam_unique` ON `medewerkers` (`gebruikersnaam`);--> statement-breakpoint
CREATE TABLE `onderdelen` (
	`id` text PRIMARY KEY NOT NULL,
	`naam` text NOT NULL,
	`slug` text NOT NULL,
	`accent` text NOT NULL,
	`accent_pressed` text NOT NULL,
	`accent_tint` text NOT NULL,
	`icoon` text NOT NULL,
	`uitgelicht` integer DEFAULT false NOT NULL,
	`sortering` integer DEFAULT 0 NOT NULL,
	`aantal_indicatie` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `onderdelen_naam_unique` ON `onderdelen` (`naam`);--> statement-breakpoint
CREATE UNIQUE INDEX `onderdelen_slug_unique` ON `onderdelen` (`slug`);--> statement-breakpoint
CREATE TABLE `onderhoudsacties` (
	`id` text PRIMARY KEY NOT NULL,
	`categorie_id` text NOT NULL,
	`naam` text NOT NULL,
	`is_afkeuren` integer DEFAULT false NOT NULL,
	`sortering` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`categorie_id`) REFERENCES `categorieen`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `actie_categorie` ON `onderhoudsacties` (`categorie_id`);--> statement-breakpoint
CREATE TABLE `velddefinities` (
	`id` text PRIMARY KEY NOT NULL,
	`categorie_id` text NOT NULL,
	`naam` text NOT NULL,
	`type` text DEFAULT 'TEKST' NOT NULL,
	`eenheid` text,
	`opties` text DEFAULT '[]' NOT NULL,
	`sortering` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`categorie_id`) REFERENCES `categorieen`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `veld_categorie` ON `velddefinities` (`categorie_id`);
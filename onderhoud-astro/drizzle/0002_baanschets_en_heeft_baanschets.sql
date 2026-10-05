CREATE TABLE `baanschets_cellen` (
	`id` text PRIMARY KEY NOT NULL,
	`rij` integer NOT NULL,
	`kolom` integer NOT NULL,
	`categorie` text NOT NULL,
	`leeftijd` integer,
	`opmerking` text DEFAULT '' NOT NULL,
	`gemarkeerd` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `baanschets_cel_positie` ON `baanschets_cellen` (`rij`,`kolom`);--> statement-breakpoint
CREATE TABLE `baanschets_instellingen` (
	`id` text PRIMARY KEY NOT NULL,
	`breedte_m` real DEFAULT 2.17 NOT NULL,
	`hoogte_m` real DEFAULT 1.45 NOT NULL,
	`basisleeftijd_seizoenen` integer DEFAULT 6 NOT NULL,
	`aantal_rijen` integer DEFAULT 40 NOT NULL,
	`aantal_kolommen` integer DEFAULT 40 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `baanschets_nieuwe_matten` (
	`id` text PRIMARY KEY NOT NULL,
	`seizoen` text NOT NULL,
	`aantal` integer NOT NULL,
	`leeftijd_bij_opname` integer NOT NULL,
	`vanuit` text DEFAULT '' NOT NULL,
	`toelichting` text DEFAULT '' NOT NULL,
	`medewerker_id` text,
	`medewerker_naam` text DEFAULT '' NOT NULL,
	`tijdstip` integer NOT NULL,
	FOREIGN KEY (`medewerker_id`) REFERENCES `medewerkers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `nieuwematten_tijdstip` ON `baanschets_nieuwe_matten` (`tijdstip`);--> statement-breakpoint
CREATE TABLE `baanschets_rotaties` (
	`id` text PRIMARY KEY NOT NULL,
	`seizoen` text NOT NULL,
	`van` text NOT NULL,
	`naar` text NOT NULL,
	`toelichting` text DEFAULT '' NOT NULL,
	`medewerker_id` text,
	`medewerker_naam` text DEFAULT '' NOT NULL,
	`tijdstip` integer NOT NULL,
	FOREIGN KEY (`medewerker_id`) REFERENCES `medewerkers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `rotatie_tijdstip` ON `baanschets_rotaties` (`tijdstip`);--> statement-breakpoint
CREATE TABLE `baanschets_sectie_bereiken` (
	`id` text PRIMARY KEY NOT NULL,
	`sectie_id` text NOT NULL,
	`rij_van` integer NOT NULL,
	`rij_tot` integer NOT NULL,
	`kolom_van` integer NOT NULL,
	`kolom_tot` integer NOT NULL,
	FOREIGN KEY (`sectie_id`) REFERENCES `baanschets_secties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sectiebereik_sectie` ON `baanschets_sectie_bereiken` (`sectie_id`);--> statement-breakpoint
CREATE TABLE `baanschets_secties` (
	`id` text PRIMARY KEY NOT NULL,
	`nr` integer NOT NULL,
	`omschrijving` text DEFAULT '' NOT NULL,
	`sortering` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `baanschets_secties_nr_unique` ON `baanschets_secties` (`nr`);--> statement-breakpoint
ALTER TABLE `onderdelen` ADD `heeft_baanschets` integer DEFAULT false NOT NULL;
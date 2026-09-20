CREATE TABLE `onderhoudsverzoeken` (
	`id` text PRIMARY KEY NOT NULL,
	`materiaal_db_id` text NOT NULL,
	`actie_naam` text NOT NULL,
	`actie_id` text,
	`opmerking` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`gemeld_door_id` text NOT NULL,
	`gemeld_door_naam` text NOT NULL,
	`gemeld_op` integer NOT NULL,
	`afgehandeld_door_naam` text,
	`afgehandeld_op` integer,
	`logregel_id` text,
	`client_id` text NOT NULL,
	FOREIGN KEY (`materiaal_db_id`) REFERENCES `materiaal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`gemeld_door_id`) REFERENCES `medewerkers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `onderhoudsverzoeken_client_id_unique` ON `onderhoudsverzoeken` (`client_id`);--> statement-breakpoint
CREATE INDEX `verzoek_materiaal` ON `onderhoudsverzoeken` (`materiaal_db_id`);--> statement-breakpoint
CREATE INDEX `verzoek_status` ON `onderhoudsverzoeken` (`status`);
CREATE TABLE `fiets_hotspots` (
	`id` text PRIMARY KEY NOT NULL,
	`categorie_id` text NOT NULL,
	`actie_id` text NOT NULL,
	`label` text NOT NULL,
	`x_pct` real NOT NULL,
	`y_pct` real NOT NULL,
	FOREIGN KEY (`categorie_id`) REFERENCES `categorieen`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actie_id`) REFERENCES `onderhoudsacties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `hotspot_categorie` ON `fiets_hotspots` (`categorie_id`);--> statement-breakpoint
ALTER TABLE `categorieen` ADD `fietsfoto_url` text;
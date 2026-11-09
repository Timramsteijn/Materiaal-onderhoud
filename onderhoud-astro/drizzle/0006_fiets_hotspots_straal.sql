ALTER TABLE `fiets_hotspots` DROP COLUMN `label`;--> statement-breakpoint
ALTER TABLE `fiets_hotspots` ADD `r_pct` real DEFAULT 6 NOT NULL;

ALTER TABLE `onderdelen` ADD `materiaal_meervoud` text;--> statement-breakpoint
ALTER TABLE `onderdelen` ADD `materiaal_nieuw_kop` text;--> statement-breakpoint
ALTER TABLE `onderdelen` ADD `materiaal_id_label` text;--> statement-breakpoint
ALTER TABLE `onderdelen` ADD `verberg_merk_model` integer DEFAULT false NOT NULL;--> statement-breakpoint
-- Opstakelparcours wordt hernoemd naar Survivalbos. Slug/naam staan in
-- seed-data.mjs al op "survivalbos", dus seed.mjs zou er zo een TWEEDE,
-- losstaand onderdeel bij zetten in plaats van het bestaande om te dopen
-- (de id wordt afgeleid van de slug). De oude rij opruimen laat seed.mjs 'm
-- vers opbouwen onder de nieuwe naam. Alleen als er nog geen materiaal onder
-- hangt -- staat er al iets echts, dan gebeurt er bewust niets (geen
-- cascade-delete van echte data) en blijft de oude rij gewoon staan.
DELETE FROM `onderdelen`
WHERE `id` = 'ond_opstakelparcours'
  AND NOT EXISTS (SELECT 1 FROM `materiaal` WHERE `onderdeel_id` = 'ond_opstakelparcours');
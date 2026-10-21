-- Hindernissen is verplaatst van een categorie onder Baan & Installaties naar
-- een eigen onderdeel "Opstakelparcours" (andere locatie op het terrein). De
-- oude categorierij is daardoor wees geworden -- seed.mjs update/voegt toe,
-- maar verwijdert nooit zelf een categorie die uit de config is gehaald.
-- ON DELETE CASCADE ruimt de bijbehorende acties en velddefinities vanzelf op.
DELETE FROM `categorieen` WHERE `id` = 'cat_baan-installaties_hindernissen';

/*
  Warnings:

  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `departments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maintenance_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `materials` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('BEHEERDER', 'MEDEWERKER', 'STAGIAIR');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('IN_GEBRUIK', 'IN_REPARATIE', 'BUITEN_GEBRUIK', 'TER_GOEDKEURING');

-- CreateEnum
CREATE TYPE "VeldType" AS ENUM ('TEKST', 'GETAL', 'BEREIK', 'DATUM', 'KEUZE');

-- CreateEnum
CREATE TYPE "LogSoort" AS ENUM ('REGISTRATIE', 'AFKEURING_AANGEVRAAGD', 'AFKEURING_GOEDGEKEURD', 'AFKEURING_AFGEWEZEN');

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_logs" DROP CONSTRAINT "maintenance_logs_materialId_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_logs" DROP CONSTRAINT "maintenance_logs_uitgevoerdDoorId_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_categoryId_fkey";

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "departments";

-- DropTable
DROP TABLE "maintenance_logs";

-- DropTable
DROP TABLE "materials";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "MaterialStatus";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "medewerkers" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "gebruikersnaam" TEXT NOT NULL,
    "wachtwoordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'MEDEWERKER',
    "functie" TEXT NOT NULL DEFAULT '',
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "aangemaakt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medewerkers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onderdelen" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "accentPressed" TEXT NOT NULL,
    "accentTint" TEXT NOT NULL,
    "icoon" TEXT NOT NULL,
    "uitgelicht" BOOLEAN NOT NULL DEFAULT false,
    "sortering" INTEGER NOT NULL DEFAULT 0,
    "aantalIndicatie" INTEGER NOT NULL DEFAULT 0,
    "aangemaakt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onderdelen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorieen" (
    "id" TEXT NOT NULL,
    "onderdeelId" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "sortering" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "categorieen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onderhoudsacties" (
    "id" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "isAfkeuren" BOOLEAN NOT NULL DEFAULT false,
    "sortering" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "onderhoudsacties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "velddefinities" (
    "id" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "type" "VeldType" NOT NULL DEFAULT 'TEKST',
    "eenheid" TEXT,
    "opties" TEXT[],
    "sortering" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "velddefinities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiaal" (
    "id" TEXT NOT NULL,
    "materiaalId" TEXT NOT NULL,
    "onderdeelId" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "merkModel" TEXT NOT NULL,
    "locatie" TEXT NOT NULL DEFAULT '',
    "status" "Status" NOT NULL DEFAULT 'IN_GEBRUIK',
    "statusVoorKeuring" "Status",
    "inGebruikSinds" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "laatsteOnderhoud" TIMESTAMP(3),
    "aantalBeurten" INTEGER NOT NULL DEFAULT 0,
    "veldwaarden" JSONB NOT NULL DEFAULT '{}',
    "aangemaakt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materiaal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logregels" (
    "id" TEXT NOT NULL,
    "materiaalDbId" TEXT NOT NULL,
    "actieNaam" TEXT NOT NULL,
    "actieId" TEXT,
    "opmerking" TEXT NOT NULL DEFAULT '',
    "statusNa" "Status",
    "medewerkerId" TEXT NOT NULL,
    "medewerkerNaam" TEXT NOT NULL,
    "tijdstip" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soort" "LogSoort" NOT NULL DEFAULT 'REGISTRATIE',
    "clientId" TEXT NOT NULL,

    CONSTRAINT "logregels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beheerlog" (
    "id" TEXT NOT NULL,
    "medewerkerId" TEXT NOT NULL,
    "wat" TEXT NOT NULL,
    "detail" JSONB NOT NULL DEFAULT '{}',
    "tijdstip" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beheerlog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medewerkers_gebruikersnaam_key" ON "medewerkers"("gebruikersnaam");

-- CreateIndex
CREATE UNIQUE INDEX "onderdelen_naam_key" ON "onderdelen"("naam");

-- CreateIndex
CREATE UNIQUE INDEX "onderdelen_slug_key" ON "onderdelen"("slug");

-- CreateIndex
CREATE INDEX "categorieen_onderdeelId_idx" ON "categorieen"("onderdeelId");

-- CreateIndex
CREATE UNIQUE INDEX "categorieen_onderdeelId_naam_key" ON "categorieen"("onderdeelId", "naam");

-- CreateIndex
CREATE INDEX "onderhoudsacties_categorieId_idx" ON "onderhoudsacties"("categorieId");

-- CreateIndex
CREATE INDEX "velddefinities_categorieId_idx" ON "velddefinities"("categorieId");

-- CreateIndex
CREATE INDEX "materiaal_categorieId_idx" ON "materiaal"("categorieId");

-- CreateIndex
CREATE UNIQUE INDEX "materiaal_onderdeelId_materiaalId_key" ON "materiaal"("onderdeelId", "materiaalId");

-- CreateIndex
CREATE UNIQUE INDEX "logregels_clientId_key" ON "logregels"("clientId");

-- CreateIndex
CREATE INDEX "logregels_materiaalDbId_idx" ON "logregels"("materiaalDbId");

-- CreateIndex
CREATE INDEX "logregels_tijdstip_idx" ON "logregels"("tijdstip");

-- CreateIndex
CREATE INDEX "beheerlog_tijdstip_idx" ON "beheerlog"("tijdstip");

-- AddForeignKey
ALTER TABLE "categorieen" ADD CONSTRAINT "categorieen_onderdeelId_fkey" FOREIGN KEY ("onderdeelId") REFERENCES "onderdelen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onderhoudsacties" ADD CONSTRAINT "onderhoudsacties_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categorieen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "velddefinities" ADD CONSTRAINT "velddefinities_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categorieen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiaal" ADD CONSTRAINT "materiaal_onderdeelId_fkey" FOREIGN KEY ("onderdeelId") REFERENCES "onderdelen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiaal" ADD CONSTRAINT "materiaal_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categorieen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logregels" ADD CONSTRAINT "logregels_materiaalDbId_fkey" FOREIGN KEY ("materiaalDbId") REFERENCES "materiaal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logregels" ADD CONSTRAINT "logregels_medewerkerId_fkey" FOREIGN KEY ("medewerkerId") REFERENCES "medewerkers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beheerlog" ADD CONSTRAINT "beheerlog_medewerkerId_fkey" FOREIGN KEY ("medewerkerId") REFERENCES "medewerkers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('INSTRUCTEUR', 'DUTY_MANAGER');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('IN_GEBRUIK', 'IN_REPARATIE', 'BUITEN_GEBRUIK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "gebruikersnaam" TEXT NOT NULL,
    "wachtwoordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'INSTRUCTEUR',
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "aangemaakt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "acties" TEXT[],
    "aangemaakt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "merk" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "maat" TEXT,
    "aanschafjaar" INTEGER,
    "status" "MaterialStatus" NOT NULL DEFAULT 'IN_GEBRUIK',
    "opmerkingen" TEXT,
    "aangemaakt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "materialId" TEXT NOT NULL,
    "actie" TEXT NOT NULL,
    "uitgevoerdDoorId" TEXT NOT NULL,
    "opmerkingen" TEXT,
    "nieuweStatus" "MaterialStatus",

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_gebruikersnaam_key" ON "users"("gebruikersnaam");

-- CreateIndex
CREATE UNIQUE INDEX "categories_naam_key" ON "categories"("naam");

-- CreateIndex
CREATE UNIQUE INDEX "categories_prefix_key" ON "categories"("prefix");

-- CreateIndex
CREATE INDEX "materials_categoryId_idx" ON "materials"("categoryId");

-- CreateIndex
CREATE INDEX "maintenance_logs_materialId_idx" ON "maintenance_logs"("materialId");

-- CreateIndex
CREATE INDEX "maintenance_logs_datum_idx" ON "maintenance_logs"("datum");

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_uitgevoerdDoorId_fkey" FOREIGN KEY ("uitgevoerdDoorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

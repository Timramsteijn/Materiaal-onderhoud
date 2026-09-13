-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "extraVeldLabel" TEXT;

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "extraVeldWaarde" TEXT,
ADD COLUMN     "inGebruikSinds" TIMESTAMP(3),
ADD COLUMN     "locatie" TEXT;

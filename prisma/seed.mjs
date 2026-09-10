// Idempotent seed-script: kan veilig bij elke opstart opnieuw draaien (upserts).
// Bewust in plain JS (geen ts-node/tsx nodig) zodat dit ook in de lichte
// Docker-runtime-image kan draaien.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STANDAARD_ACTIES = [
  "Visueel controleren op beschadiging",
  "Slijpen van de kanten",
  "Controle van de bindingen",
  "Algehele onderhoudsbeurt (slijpen kanten + belag)",
];

const OVERIGE_ONDERDELEN = ["Mountainbike", "Boogschieten", "Klimmateriaal", "Kano & Kajak & SUP"];

async function main() {
  const skiSnowboard = await prisma.department.upsert({
    where: { naam: "Ski & Snowboard" },
    update: {},
    create: { naam: "Ski & Snowboard" },
  });

  for (const naam of OVERIGE_ONDERDELEN) {
    await prisma.department.upsert({ where: { naam }, update: {}, create: { naam } });
  }

  await prisma.category.upsert({
    where: { naam: "Ski" },
    update: {},
    create: { naam: "Ski", prefix: "SKI", acties: STANDAARD_ACTIES, departmentId: skiSnowboard.id },
  });

  await prisma.category.upsert({
    where: { naam: "Snowboard" },
    update: {},
    create: { naam: "Snowboard", prefix: "SB", acties: STANDAARD_ACTIES, departmentId: skiSnowboard.id },
  });

  const adminGebruikersnaam = "beheer";
  const bestaandeAdmin = await prisma.user.findUnique({
    where: { gebruikersnaam: adminGebruikersnaam },
  });

  if (!bestaandeAdmin) {
    const wachtwoord = process.env.SEED_ADMIN_WACHTWOORD;
    if (!wachtwoord) {
      throw new Error(
        "SEED_ADMIN_WACHTWOORD is niet ingesteld — nodig om het eerste beheeraccount aan te maken."
      );
    }
    const wachtwoordHash = await bcrypt.hash(wachtwoord, 12);
    await prisma.user.create({
      data: {
        naam: "Beheer",
        gebruikersnaam: adminGebruikersnaam,
        wachtwoordHash,
        role: "DUTY_MANAGER",
      },
    });
    console.log(
      `Eerste duty-manager-account aangemaakt (gebruikersnaam: "${adminGebruikersnaam}"). Wachtwoord direct wijzigen na eerste login!`
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

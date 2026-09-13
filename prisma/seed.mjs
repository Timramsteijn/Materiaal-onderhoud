// Idempotent seed-script: kan veilig bij elke opstart opnieuw draaien (upserts).
// Bewust in plain JS (geen ts-node/tsx nodig) zodat dit ook in de lichte
// Docker-runtime-image kan draaien.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Onderhoudsacties uit het Materiaalonderhoud-ontwerp, gedeeld door alle
// categorieen binnen Ski & Snowboard.
const SKI_SNOWBOARD_ACTIES = [
  "Slijpen",
  "Waxen",
  "Binding controleren",
  "Schoenmaat aanpassen",
  "Reparatie",
  "Afkeuren",
];

const SKI_SNOWBOARD_CATEGORIEEN = [
  { naam: "Ski", prefix: "SKI", extraVeldLabel: "DIN" },
  { naam: "Snowboard", prefix: "SB", extraVeldLabel: null },
  { naam: "Schoenen", prefix: "SCH", extraVeldLabel: null },
  { naam: "Helm", prefix: "HLM", extraVeldLabel: null },
  { naam: "Stokken", prefix: "STK", extraVeldLabel: null },
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

  for (const { naam, prefix, extraVeldLabel } of SKI_SNOWBOARD_CATEGORIEEN) {
    await prisma.category.upsert({
      where: { naam },
      update: { prefix, acties: SKI_SNOWBOARD_ACTIES, extraVeldLabel, departmentId: skiSnowboard.id },
      create: {
        naam,
        prefix,
        acties: SKI_SNOWBOARD_ACTIES,
        extraVeldLabel,
        departmentId: skiSnowboard.id,
      },
    });
  }

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

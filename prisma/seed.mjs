// Idempotent seed-script: kan veilig bij elke opstart opnieuw draaien (upserts).
// Bewust in plain JS (geen ts-node/tsx nodig) zodat dit ook in de lichte
// Docker-runtime-image kan draaien.
//
// De configuratie hieronder is alles wat een onderdeel nodig heeft: categorieën
// met hun eigen acties en velddefinities. Een nieuw onderdeel toevoegen kost
// dus alleen data — geen code.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const AFKEUREN = { naam: "Afkeuren", isAfkeuren: true };

const ONDERDELEN = [
  {
    naam: "Ski & Snowboard",
    slug: "ski-snowboard",
    accent: "#1f5fd0",
    accentPressed: "#17469b",
    accentTint: "#e4ecf9",
    icoon: "ski",
    uitgelicht: true,
    sortering: 1,
    aantalIndicatie: 1248,
    categorieen: [
      {
        naam: "Ski",
        acties: ["Slijpen", "Waxen", "Binding controleren", "Reparatie", AFKEUREN],
        velden: [
          { naam: "Lengte", type: "GETAL", eenheid: "cm" },
          { naam: "DIN-bereik", type: "BEREIK" },
          { naam: "Bindingtype", type: "TEKST" },
          { naam: "Radius", type: "GETAL", eenheid: "m" },
        ],
      },
      {
        naam: "Snowboard",
        acties: ["Waxen", "Kanten bijwerken", "Binding controleren", "Reparatie", AFKEUREN],
        velden: [
          { naam: "Lengte", type: "GETAL", eenheid: "cm" },
          { naam: "Flex", type: "TEKST" },
          { naam: "Bindingmaat", type: "TEKST" },
        ],
      },
      {
        naam: "Schoenen",
        acties: ["Schoenmaat aanpassen", "Clips controleren", "Reinigen", "Reparatie", AFKEUREN],
        velden: [
          { naam: "Maat (mondopoint)", type: "TEKST" },
          { naam: "Flexindex", type: "GETAL" },
          { naam: "Zoollengte", type: "GETAL", eenheid: "mm" },
        ],
      },
      {
        naam: "Helm",
        acties: ["Reinigen", "Schaal controleren", AFKEUREN],
        velden: [
          { naam: "Maat", type: "TEKST" },
          { naam: "Productiejaar", type: "GETAL" },
        ],
      },
      {
        naam: "Stokken",
        acties: ["Lussen controleren", "Reparatie", AFKEUREN],
        velden: [{ naam: "Lengte", type: "GETAL", eenheid: "cm" }],
      },
    ],
  },
  {
    naam: "Mountainbike",
    slug: "mountainbike",
    accent: "#ff6a3d",
    accentPressed: "#d1521f",
    accentTint: "#ffe7df",
    icoon: "bike",
    sortering: 2,
    aantalIndicatie: 86,
    categorieen: [
      {
        naam: "MTB",
        acties: [
          "Remmen controleren",
          "Derailleur stellen",
          "Ketting reinigen",
          "Wielen centreren",
          "Bandenspanning",
          "Reparatie",
          AFKEUREN,
        ],
        velden: [
          { naam: "Framemaat", type: "TEKST" },
          { naam: "Wielmaat", type: "TEKST", eenheid: '"' },
          { naam: "Versnellingen", type: "GETAL" },
          { naam: "Veerweg", type: "GETAL", eenheid: "mm" },
        ],
      },
      {
        naam: "E-MTB",
        acties: [
          "Remmen controleren",
          "Derailleur stellen",
          "Accu testen",
          "Software bijwerken",
          "Reparatie",
          AFKEUREN,
        ],
        velden: [
          { naam: "Framemaat", type: "TEKST" },
          { naam: "Wielmaat", type: "TEKST", eenheid: '"' },
          { naam: "Motor", type: "TEKST" },
          { naam: "Accucapaciteit", type: "TEKST", eenheid: "Wh" },
          { naam: "Laadcycli", type: "GETAL" },
        ],
      },
      {
        naam: "Helm",
        acties: ["Reinigen", "Schaal controleren", AFKEUREN],
        velden: [
          { naam: "Maat", type: "TEKST" },
          { naam: "Productiejaar", type: "GETAL" },
        ],
      },
      {
        naam: "Beschermers",
        acties: ["Reinigen", "Sluitingen controleren", AFKEUREN],
        velden: [
          { naam: "Maat", type: "TEKST" },
          { naam: "Type", type: "TEKST" },
        ],
      },
    ],
  },
  {
    naam: "Boogschieten",
    slug: "boogschieten",
    accent: "#6b942a",
    accentPressed: "#46601a",
    accentTint: "#edf3e0",
    icoon: "target",
    sortering: 3,
    aantalIndicatie: 142,
    categorieen: [],
  },
  {
    naam: "Klimmateriaal",
    slug: "klimmateriaal",
    accent: "#a03c14",
    accentPressed: "#7d2f10",
    accentTint: "#ffe7df",
    icoon: "mountain",
    sortering: 4,
    aantalIndicatie: 310,
    categorieen: [],
  },
  {
    naam: "Kano & Kajak & SUP",
    slug: "kano-kajak-sup",
    accent: "#2a7d94",
    accentPressed: "#1d5a6c",
    accentTint: "#e0eef2",
    icoon: "waves",
    sortering: 5,
    aantalIndicatie: 64,
    categorieen: [],
  },
];

const MEDEWERKERS = [
  {
    naam: "Tim Verhoeven",
    gebruikersnaam: "t.verhoeven",
    rol: "BEHEERDER",
    functie: "Beheerder · Ski & Snowboard",
    actief: true,
  },
  {
    naam: "Sanne de Groot",
    gebruikersnaam: "s.degroot",
    rol: "MEDEWERKER",
    functie: "Medewerker · verhuurbalie",
    actief: true,
  },
  {
    naam: "Youssef El Amrani",
    gebruikersnaam: "y.elamrani",
    rol: "MEDEWERKER",
    functie: "Medewerker · werkplaats",
    actief: true,
  },
  {
    naam: "Bram Kuiper",
    gebruikersnaam: "b.kuiper",
    rol: "STAGIAIR",
    functie: "Stagiair · werkplaats",
    actief: false,
  },
];

/** dagenGeleden → Date (met tijd), zodat de seed relatief aan vandaag blijft. */
function dagen(aantal, uur = 9, minuut = 0) {
  const d = new Date();
  d.setDate(d.getDate() - aantal);
  d.setHours(uur, minuut, 0, 0);
  return d;
}

function maanden(aantal) {
  const d = new Date();
  d.setMonth(d.getMonth() - aantal);
  return d;
}

const MATERIAAL = {
  "ski-snowboard": [
    {
      materiaalId: "SKI-0842",
      categorie: "Ski",
      merkModel: "Atomic Redster X5",
      locatie: "Rek A-03",
      status: "IN_GEBRUIK",
      inGebruikSinds: new Date("2022-10-04"),
      velden: { Lengte: "170", "DIN-bereik": "3 – 10", Bindingtype: "Atomic X 12", Radius: "14" },
      log: [{ actie: "Waxen", dagen: 6, uur: 10, minuut: 12, door: "Sanne de Groot", opmerking: "Onderhoudswax voor de kerstvakantie." }],
    },
    {
      materiaalId: "SKI-0917",
      categorie: "Ski",
      merkModel: "Rossignol Experience 78",
      locatie: "Werkplaats · werkbank 2",
      status: "IN_REPARATIE",
      inGebruikSinds: new Date("2023-11-11"),
      velden: { Lengte: "158", "DIN-bereik": "3 – 10", Bindingtype: "Look Xpress 10", Radius: "13" },
      aantalBeurtenExtra: 8,
      log: [
        { actie: "Slijpen", dagen: 86, uur: 11, minuut: 5, door: "Tim Verhoeven", opmerking: "Kanten bijgewerkt, lichte slag uit de linkerski." },
        { actie: "Waxen", dagen: 70, uur: 14, minuut: 30, door: "Sanne de Groot", opmerking: "Standaard zomerwax na seizoensopslag." },
        { actie: "Binding controleren", dagen: 22, uur: 9, minuut: 40, door: "Youssef El Amrani", opmerking: "DIN teruggezet naar 6, linkerbinding loopt zwaar." },
        { actie: "Binding controleren", dagen: 0, uur: 9, minuut: 14, door: "Tim Verhoeven", opmerking: "Binding loopt nog steeds zwaar, naar de werkbank.", statusNa: "IN_REPARATIE" },
      ],
    },
    {
      materiaalId: "SB-0231",
      categorie: "Snowboard",
      merkModel: "Burton Ripcord",
      locatie: "Rek C-11",
      status: "IN_GEBRUIK",
      inGebruikSinds: new Date("2023-02-18"),
      velden: { Lengte: "154", Flex: "Soft", Bindingmaat: "M" },
      log: [{ actie: "Waxen", dagen: 1, uur: 14, minuut: 5, door: "Youssef El Amrani", opmerking: "Basis gereinigd en gewaxt." }],
    },
    {
      materiaalId: "SCH-1104",
      categorie: "Schoenen",
      merkModel: "Salomon X Access 80",
      locatie: "Schoenenrek 4",
      status: "BUITEN_GEBRUIK",
      inGebruikSinds: new Date("2021-12-01"),
      velden: { "Maat (mondopoint)": "26.5 (42)", Flexindex: "80", Zoollengte: "306" },
      log: [{ actie: "Afkeuren", dagen: 1, uur: 16, minuut: 38, door: "Tim Verhoeven", opmerking: "Schaal gescheurd bij de hiel, niet meer te repareren.", statusNa: "BUITEN_GEBRUIK", soort: "AFKEURING_GOEDGEKEURD" }],
    },
    {
      materiaalId: "HLM-0455",
      categorie: "Helm",
      merkModel: "Uvex Legend 2.0",
      locatie: "Helmenrek 2",
      status: "IN_GEBRUIK",
      inGebruikSinds: new Date("2024-01-09"),
      velden: { Maat: "M (55-59)", Productiejaar: "2023" },
      log: [{ actie: "Reinigen", dagen: 0, uur: 8, minuut: 52, door: "Sanne de Groot", opmerking: "Binnenvoering gewassen." }],
    },
    {
      materiaalId: "SKI-1033",
      categorie: "Ski",
      merkModel: "Völkl Deacon 74",
      locatie: "Rek A-07",
      status: "IN_GEBRUIK",
      inGebruikSinds: new Date("2024-11-20"),
      velden: { Lengte: "163", "DIN-bereik": "3 – 11", Bindingtype: "Marker rMotion 12", Radius: "14" },
      log: [{ actie: "Slijpen", dagen: 1, uur: 13, minuut: 20, door: "Youssef El Amrani", opmerking: "Kanten gezet, terug de verhuur in.", statusNa: "IN_GEBRUIK" }],
    },
    {
      materiaalId: "STK-0620",
      categorie: "Stokken",
      merkModel: "Leki Blue Bird",
      locatie: "Stokkenbak 1",
      status: "IN_GEBRUIK",
      inGebruikSinds: new Date("2023-09-30"),
      velden: { Lengte: "115" },
      log: [{ actie: "Lussen controleren", dagen: 2, uur: 11, minuut: 47, door: "Sanne de Groot", opmerking: "Beide lussen vastgezet." }],
    },
    // Materiaal met achterstallig onderhoud (voedt "Aandacht nodig")
    {
      materiaalId: "SKI-0208",
      categorie: "Ski",
      merkModel: "Head Kore 87",
      locatie: "Rek B-02",
      status: "IN_GEBRUIK",
      inGebruikSinds: new Date("2021-11-15"),
      velden: { Lengte: "170", "DIN-bereik": "4 – 12", Bindingtype: "Tyrolia Attack 13", Radius: "15" },
      log: [{ actie: "Slijpen", dagen: 412, uur: 10, door: "Tim Verhoeven", opmerking: "Jaarlijkse beurt." }],
    },
    {
      materiaalId: "SB-0119",
      categorie: "Snowboard",
      merkModel: "Nitro Prime",
      locatie: "Rek C-04",
      status: "TER_GOEDKEURING",
      statusVoorKeuring: "IN_GEBRUIK",
      inGebruikSinds: new Date("2020-12-07"),
      velden: { Lengte: "152", Flex: "Medium", Bindingmaat: "L" },
      log: [
        { actie: "Waxen", dagen: 358, uur: 9, door: "Sanne de Groot", opmerking: "Seizoensbeurt." },
        { actie: "Afkeuren", dagen: 0, uur: 8, minuut: 36, door: "Youssef El Amrani", opmerking: "Delaminatie bij de neus over ruim 10 cm.", soort: "AFKEURING_AANGEVRAAGD" },
      ],
    },
    {
      materiaalId: "SCH-0761",
      categorie: "Schoenen",
      merkModel: "Nordica Sportmachine",
      locatie: "Schoenenrek 2",
      status: "TER_GOEDKEURING",
      statusVoorKeuring: "IN_REPARATIE",
      inGebruikSinds: new Date("2021-10-22"),
      velden: { "Maat (mondopoint)": "28.5 (44)", Flexindex: "90", Zoollengte: "326" },
      log: [
        { actie: "Clips controleren", dagen: 301, uur: 15, door: "Tim Verhoeven", opmerking: "Twee clips vervangen." },
        { actie: "Afkeuren", dagen: 1, uur: 15, minuut: 2, door: "Sanne de Groot", opmerking: "Zool laat los, binnenschoen doorgesleten.", soort: "AFKEURING_AANGEVRAAGD" },
      ],
    },
  ],
  mountainbike: [
    {
      materiaalId: "MTB-0142",
      categorie: "MTB",
      merkModel: "Trek Marlin 7",
      locatie: "Stalling 1 · plek 4",
      status: "IN_GEBRUIK",
      inGebruikSinds: new Date("2024-03-12"),
      velden: { Framemaat: "M", Wielmaat: "29", Versnellingen: "10", Veerweg: "100" },
      log: [{ actie: "Ketting reinigen", dagen: 3, uur: 9, minuut: 30, door: "Youssef El Amrani", opmerking: "Ketting gereinigd en gesmeerd." }],
    },
    {
      materiaalId: "MTB-0188",
      categorie: "MTB",
      merkModel: "Cube Aim SL",
      locatie: "Werkplaats · fietsbrug",
      status: "IN_REPARATIE",
      inGebruikSinds: new Date("2023-05-02"),
      velden: { Framemaat: "L", Wielmaat: "29", Versnellingen: "9", Veerweg: "100" },
      log: [{ actie: "Derailleur stellen", dagen: 2, uur: 11, minuut: 15, door: "Youssef El Amrani", opmerking: "Achterderailleur verbogen, derailleurhanger besteld.", statusNa: "IN_REPARATIE" }],
    },
    {
      materiaalId: "EMTB-0031",
      categorie: "E-MTB",
      merkModel: "Haibike AllTrack 6",
      locatie: "Laadstation 2",
      status: "IN_GEBRUIK",
      inGebruikSinds: new Date("2024-06-18"),
      velden: { Framemaat: "L", Wielmaat: "29", Motor: "Yamaha PW-ST", Accucapaciteit: "630", Laadcycli: "412" },
      log: [
        { actie: "Accu testen", dagen: 9, uur: 10, minuut: 5, door: "Tim Verhoeven", opmerking: "78% resterende capaciteit, binnen norm." },
        { actie: "Remmen controleren", dagen: 2, uur: 16, minuut: 20, door: "Youssef El Amrani", opmerking: "Remblokken voor vervangen." },
      ],
    },
    {
      materiaalId: "MTB-0206",
      categorie: "MTB",
      merkModel: "Giant Talon 3",
      locatie: "Stalling 1 · plek 9",
      status: "IN_GEBRUIK",
      inGebruikSinds: new Date("2024-04-08"),
      velden: { Framemaat: "S", Wielmaat: "27.5", Versnellingen: "8", Veerweg: "100" },
      log: [{ actie: "Bandenspanning", dagen: 4, uur: 8, minuut: 45, door: "Sanne de Groot", opmerking: "Beide banden op 2.4 bar." }],
    },
    {
      materiaalId: "HLM-2104",
      categorie: "Helm",
      merkModel: "Bell Spark",
      locatie: "Helmenrek MTB",
      status: "IN_GEBRUIK",
      inGebruikSinds: new Date("2024-02-01"),
      velden: { Maat: "L (58-62)", Productiejaar: "2023" },
      log: [{ actie: "Reinigen", dagen: 5, uur: 12, door: "Sanne de Groot", opmerking: "Gereinigd na regenrit." }],
    },
    {
      materiaalId: "BES-0455",
      categorie: "Beschermers",
      merkModel: "Fox Launch kniebeschermers",
      locatie: "Beschermingsrek",
      status: "BUITEN_GEBRUIK",
      inGebruikSinds: new Date("2022-07-14"),
      velden: { Maat: "M", Type: "Knie" },
      log: [{ actie: "Afkeuren", dagen: 20, uur: 14, door: "Tim Verhoeven", opmerking: "Schuim doorgezakt, biedt geen bescherming meer.", statusNa: "BUITEN_GEBRUIK", soort: "AFKEURING_GOEDGEKEURD" }],
    },
    {
      materiaalId: "EMTB-0018",
      categorie: "E-MTB",
      merkModel: "Focus Jam²",
      locatie: "Laadstation 1",
      status: "TER_GOEDKEURING",
      statusVoorKeuring: "IN_GEBRUIK",
      inGebruikSinds: new Date("2022-05-30"),
      velden: { Framemaat: "L", Wielmaat: "29", Motor: "Bosch Performance CX", Accucapaciteit: "500", Laadcycli: "900" },
      log: [{ actie: "Afkeuren", dagen: 0, uur: 8, minuut: 36, door: "Youssef El Amrani", opmerking: "Accu houdt 54% na 900 cycli.", soort: "AFKEURING_AANGEVRAAGD" }],
    },
  ],
};

async function main() {
  // Medewerkers
  const wachtwoord = process.env.SEED_ADMIN_WACHTWOORD;
  if (!wachtwoord) {
    throw new Error("SEED_ADMIN_WACHTWOORD is niet ingesteld — nodig voor de eerste accounts.");
  }
  const hash = await bcrypt.hash(wachtwoord, 12);

  const medewerkersOpNaam = new Map();
  for (const m of MEDEWERKERS) {
    const rij = await prisma.medewerker.upsert({
      where: { gebruikersnaam: m.gebruikersnaam },
      update: { naam: m.naam, rol: m.rol, functie: m.functie },
      create: { ...m, wachtwoordHash: hash },
    });
    medewerkersOpNaam.set(m.naam, rij);
  }

  // Onderdelen → categorieën → acties + velddefinities
  for (const o of ONDERDELEN) {
    const { categorieen, ...onderdeelData } = o;
    const onderdeel = await prisma.onderdeel.upsert({
      where: { slug: o.slug },
      update: onderdeelData,
      create: onderdeelData,
    });

    for (const [i, c] of categorieen.entries()) {
      const categorie = await prisma.categorie.upsert({
        where: { onderdeelId_naam: { onderdeelId: onderdeel.id, naam: c.naam } },
        update: { sortering: i, archivedAt: null },
        create: { onderdeelId: onderdeel.id, naam: c.naam, sortering: i },
      });

      for (const [j, a] of c.acties.entries()) {
        const actie = typeof a === "string" ? { naam: a, isAfkeuren: false } : a;
        const bestaand = await prisma.onderhoudsActie.findFirst({
          where: { categorieId: categorie.id, naam: actie.naam },
        });
        if (bestaand) {
          await prisma.onderhoudsActie.update({
            where: { id: bestaand.id },
            data: { isAfkeuren: actie.isAfkeuren, sortering: j, archivedAt: null },
          });
        } else {
          await prisma.onderhoudsActie.create({
            data: { categorieId: categorie.id, naam: actie.naam, isAfkeuren: actie.isAfkeuren, sortering: j },
          });
        }
      }

      for (const [j, v] of c.velden.entries()) {
        const bestaand = await prisma.veldDefinitie.findFirst({
          where: { categorieId: categorie.id, naam: v.naam },
        });
        const data = {
          type: v.type ?? "TEKST",
          eenheid: v.eenheid ?? null,
          opties: v.opties ?? [],
          sortering: j,
          archivedAt: null,
        };
        if (bestaand) {
          await prisma.veldDefinitie.update({ where: { id: bestaand.id }, data });
        } else {
          await prisma.veldDefinitie.create({
            data: { categorieId: categorie.id, naam: v.naam, ...data },
          });
        }
      }
    }
  }

  // Materiaal + logregels (alleen aanmaken als het nog niet bestaat, zodat een
  // herstart nooit echte registraties overschrijft)
  for (const [slug, stukken] of Object.entries(MATERIAAL)) {
    const onderdeel = await prisma.onderdeel.findUnique({
      where: { slug },
      include: { categorieen: { include: { velden: true, acties: true } } },
    });
    if (!onderdeel) continue;

    for (const s of stukken) {
      const bestaat = await prisma.materiaal.findUnique({
        where: { onderdeelId_materiaalId: { onderdeelId: onderdeel.id, materiaalId: s.materiaalId } },
      });
      if (bestaat) continue;

      const categorie = onderdeel.categorieen.find((c) => c.naam === s.categorie);
      if (!categorie) continue;

      // Veldwaarden op velddefinitie-id
      const veldwaarden = {};
      for (const [naam, waarde] of Object.entries(s.velden ?? {})) {
        const def = categorie.velden.find((v) => v.naam === naam);
        if (def) veldwaarden[def.id] = waarde;
      }

      const logs = s.log ?? [];
      const laatste = logs.length
        ? logs.map((l) => dagen(l.dagen, l.uur ?? 9, l.minuut ?? 0)).sort((a, b) => b - a)[0]
        : null;

      const materiaal = await prisma.materiaal.create({
        data: {
          materiaalId: s.materiaalId,
          onderdeelId: onderdeel.id,
          categorieId: categorie.id,
          merkModel: s.merkModel,
          locatie: s.locatie,
          status: s.status,
          statusVoorKeuring: s.statusVoorKeuring ?? null,
          inGebruikSinds: s.inGebruikSinds,
          laatsteOnderhoud: laatste,
          aantalBeurten: logs.length + (s.aantalBeurtenExtra ?? 0),
          veldwaarden,
        },
      });

      for (const l of logs) {
        const medewerker = medewerkersOpNaam.get(l.door);
        const actie = categorie.acties.find((a) => a.naam === l.actie);
        await prisma.logRegel.create({
          data: {
            materiaalDbId: materiaal.id,
            actieNaam: l.actie,
            actieId: actie?.id ?? null,
            opmerking: l.opmerking ?? "",
            statusNa: l.statusNa ?? null,
            medewerkerId: medewerker.id,
            medewerkerNaam: medewerker.naam,
            tijdstip: dagen(l.dagen, l.uur ?? 9, l.minuut ?? 0),
            soort: l.soort ?? "REGISTRATIE",
            clientId: `seed:${s.materiaalId}:${l.actie}:${l.dagen}`,
          },
        });
      }
    }
  }

  // Wat oudere registraties zodat "onderhoud per actie" over 12 maanden vult
  const skiOnderdeel = await prisma.onderdeel.findUnique({ where: { slug: "ski-snowboard" } });
  if (skiOnderdeel) {
    const bestaandExtra = await prisma.logRegel.findFirst({ where: { clientId: { startsWith: "seed:extra:" } } });
    if (!bestaandExtra) {
      const materiaal = await prisma.materiaal.findMany({
        where: { onderdeelId: skiOnderdeel.id },
        include: { categorie: { include: { acties: true } } },
      });
      const medewerkers = [...medewerkersOpNaam.values()].filter((m) => m.actief);
      let teller = 0;
      for (const m of materiaal) {
        const acties = m.categorie.acties.filter((a) => !a.isAfkeuren);
        for (let i = 0; i < 4; i++) {
          const actie = acties[i % acties.length];
          if (!actie) continue;
          const medewerker = medewerkers[teller % medewerkers.length];
          const tijdstip = maanden(1 + ((teller * 2) % 11));
          await prisma.logRegel.create({
            data: {
              materiaalDbId: m.id,
              actieNaam: actie.naam,
              actieId: actie.id,
              opmerking: "",
              medewerkerId: medewerker.id,
              medewerkerNaam: medewerker.naam,
              tijdstip,
              clientId: `seed:extra:${m.materiaalId}:${i}`,
            },
          });
          teller++;
        }
      }
    }
  }

  console.log("Seed klaar.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

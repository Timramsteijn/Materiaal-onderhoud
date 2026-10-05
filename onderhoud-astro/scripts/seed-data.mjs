/**
 * Seed-configuratie. Dit is alles wat een onderdeel nodig heeft: categorieën
 * met hun eigen acties en velddefinities. Een nieuw onderdeel toevoegen kost
 * dus alleen data — geen code.
 */

const AFKEUREN = { naam: "Afkeuren", isAfkeuren: true };

export const ONDERDELEN = [
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
          { naam: "Huidige DIN-waarde", type: "GETAL" },
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
  {
    naam: "Baan & Installaties",
    slug: "baan-installaties",
    accent: "#6b4fa0",
    accentPressed: "#4f3878",
    accentTint: "#ece6f5",
    icoon: "cable-car",
    sortering: 6,
    aantalIndicatie: 15,
    // Toont het extra navigatie-item "Baanschets" (mattenbeheer van de skibaan).
    heeftBaanschets: true,
    categorieen: [
      {
        naam: "Liften",
        acties: [
          "Aandrijving controleren",
          "Kabel/band controleren",
          "Smeren",
          "Noodstop testen",
          "Reparatie",
          AFKEUREN,
        ],
        velden: [
          { naam: "Type", type: "KEUZE", opties: ["Touwlift", "Sleeplift", "Bandlift"] },
          { naam: "Lengte", type: "GETAL", eenheid: "m" },
        ],
      },
      {
        naam: "Verlichting",
        acties: ["Lamp vervangen", "Bekabeling controleren", "Mast controleren", "Reparatie", AFKEUREN],
        velden: [{ naam: "Lamptype", type: "TEKST" }],
      },
      {
        naam: "Tubingbanen",
        acties: ["Mat controleren", "Rubber vervangen", "Reiniging", "Reparatie", AFKEUREN],
        velden: [{ naam: "Lengte", type: "GETAL", eenheid: "m" }],
      },
    ],
  },
];

export const MEDEWERKERS = [
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

export const MATERIAAL = {
  "ski-snowboard": [
    {
      materiaalId: "SKI-0842",
      categorie: "Ski",
      merkModel: "Atomic Redster X5",
      locatie: "Rek A-03",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2022-10-04",
      velden: { Lengte: "170", "DIN-bereik": "3 – 10", Bindingtype: "Atomic X 12", Radius: "14" },
      log: [{ actie: "Waxen", dagen: 6, uur: 10, minuut: 12, door: "Sanne de Groot", opmerking: "Onderhoudswax voor de kerstvakantie." }],
    },
    {
      materiaalId: "SKI-0917",
      categorie: "Ski",
      merkModel: "Rossignol Experience 78",
      locatie: "Werkplaats · werkbank 2",
      status: "IN_REPARATIE",
      inGebruikSinds: "2023-11-11",
      velden: { Lengte: "158", "DIN-bereik": "3 – 10", Bindingtype: "Look Xpress 10", Radius: "13" },
      extraBeurten: 8,
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
      inGebruikSinds: "2023-02-18",
      velden: { Lengte: "154", Flex: "Soft", Bindingmaat: "M" },
      log: [{ actie: "Waxen", dagen: 1, uur: 14, minuut: 5, door: "Youssef El Amrani", opmerking: "Basis gereinigd en gewaxt." }],
    },
    {
      materiaalId: "SCH-1104",
      categorie: "Schoenen",
      merkModel: "Salomon X Access 80",
      locatie: "Schoenenrek 4",
      status: "BUITEN_GEBRUIK",
      inGebruikSinds: "2021-12-01",
      velden: { "Maat (mondopoint)": "26.5 (42)", Flexindex: "80", Zoollengte: "306" },
      log: [{ actie: "Afkeuren", dagen: 1, uur: 16, minuut: 38, door: "Tim Verhoeven", opmerking: "Schaal gescheurd bij de hiel, niet meer te repareren.", statusNa: "BUITEN_GEBRUIK", soort: "AFKEURING_GOEDGEKEURD" }],
    },
    {
      materiaalId: "HLM-0455",
      categorie: "Helm",
      merkModel: "Uvex Legend 2.0",
      locatie: "Helmenrek 2",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2024-01-09",
      velden: { Maat: "M (55-59)", Productiejaar: "2023" },
      log: [{ actie: "Reinigen", dagen: 0, uur: 8, minuut: 52, door: "Sanne de Groot", opmerking: "Binnenvoering gewassen." }],
    },
    {
      materiaalId: "SKI-1033",
      categorie: "Ski",
      merkModel: "Völkl Deacon 74",
      locatie: "Rek A-07",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2024-11-20",
      velden: { Lengte: "163", "DIN-bereik": "3 – 11", Bindingtype: "Marker rMotion 12", Radius: "14" },
      log: [{ actie: "Slijpen", dagen: 1, uur: 13, minuut: 20, door: "Youssef El Amrani", opmerking: "Kanten gezet, terug de verhuur in.", statusNa: "IN_GEBRUIK" }],
    },
    {
      materiaalId: "STK-0620",
      categorie: "Stokken",
      merkModel: "Leki Blue Bird",
      locatie: "Stokkenbak 1",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2023-09-30",
      velden: { Lengte: "115" },
      log: [{ actie: "Lussen controleren", dagen: 2, uur: 11, minuut: 47, door: "Sanne de Groot", opmerking: "Beide lussen vastgezet." }],
    },
    {
      materiaalId: "SKI-0208",
      categorie: "Ski",
      merkModel: "Head Kore 87",
      locatie: "Rek B-02",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2021-11-15",
      velden: { Lengte: "170", "DIN-bereik": "4 – 12", Bindingtype: "Tyrolia Attack 13", Radius: "15" },
      log: [{ actie: "Slijpen", dagen: 412, uur: 10, door: "Tim Verhoeven", opmerking: "Jaarlijkse beurt." }],
      meldingen: [{ actie: "Slijpen", dagen: 1, uur: 16, minuut: 20, door: "Sanne de Groot", opmerking: "Kanten voelen bot, klant gleed weg in de bocht." }],
    },
    {
      materiaalId: "SB-0119",
      categorie: "Snowboard",
      merkModel: "Nitro Prime",
      locatie: "Rek C-04",
      status: "TER_GOEDKEURING",
      statusVoorKeuring: "IN_GEBRUIK",
      inGebruikSinds: "2020-12-07",
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
      inGebruikSinds: "2021-10-22",
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
      inGebruikSinds: "2024-03-12",
      velden: { Framemaat: "M", Wielmaat: "29", Versnellingen: "10", Veerweg: "100" },
      log: [{ actie: "Ketting reinigen", dagen: 3, uur: 9, minuut: 30, door: "Youssef El Amrani", opmerking: "Ketting gereinigd en gesmeerd." }],
      meldingen: [{ actie: "Remmen controleren", dagen: 0, uur: 11, minuut: 5, door: "Sanne de Groot", opmerking: "Achterrem grijpt pas helemaal aan het eind." }],
    },
    {
      materiaalId: "MTB-0188",
      categorie: "MTB",
      merkModel: "Cube Aim SL",
      locatie: "Werkplaats · fietsbrug",
      status: "IN_REPARATIE",
      inGebruikSinds: "2023-05-02",
      velden: { Framemaat: "L", Wielmaat: "29", Versnellingen: "9", Veerweg: "100" },
      log: [{ actie: "Derailleur stellen", dagen: 2, uur: 11, minuut: 15, door: "Youssef El Amrani", opmerking: "Achterderailleur verbogen, derailleurhanger besteld.", statusNa: "IN_REPARATIE" }],
    },
    {
      materiaalId: "EMTB-0031",
      categorie: "E-MTB",
      merkModel: "Haibike AllTrack 6",
      locatie: "Laadstation 2",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2024-06-18",
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
      inGebruikSinds: "2024-04-08",
      velden: { Framemaat: "S", Wielmaat: "27.5", Versnellingen: "8", Veerweg: "100" },
      log: [{ actie: "Bandenspanning", dagen: 4, uur: 8, minuut: 45, door: "Sanne de Groot", opmerking: "Beide banden op 2.4 bar." }],
    },
    {
      materiaalId: "HLM-2104",
      categorie: "Helm",
      merkModel: "Bell Spark",
      locatie: "Helmenrek MTB",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2024-02-01",
      velden: { Maat: "L (58-62)", Productiejaar: "2023" },
      log: [{ actie: "Reinigen", dagen: 5, uur: 12, door: "Sanne de Groot", opmerking: "Gereinigd na regenrit." }],
    },
    {
      materiaalId: "BES-0455",
      categorie: "Beschermers",
      merkModel: "Fox Launch kniebeschermers",
      locatie: "Beschermingsrek",
      status: "BUITEN_GEBRUIK",
      inGebruikSinds: "2022-07-14",
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
      inGebruikSinds: "2022-05-30",
      velden: { Framemaat: "L", Wielmaat: "29", Motor: "Bosch Performance CX", Accucapaciteit: "500", Laadcycli: "900" },
      log: [{ actie: "Afkeuren", dagen: 0, uur: 8, minuut: 36, door: "Youssef El Amrani", opmerking: "Accu houdt 54% na 900 cycli.", soort: "AFKEURING_AANGEVRAAGD" }],
    },
  ],
  "baan-installaties": [
    {
      materiaalId: "LIFT-01",
      categorie: "Liften",
      merkModel: "Touwlift onderbaan",
      locatie: "Beneden aan de baan",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2016-11-01",
      velden: { Type: "Touwlift", Lengte: "90" },
      log: [{ actie: "Kabel/band controleren", dagen: 14, uur: 8, minuut: 30, door: "Youssef El Amrani", opmerking: "Spanning van de trektouw gecontroleerd en bijgesteld." }],
    },
    {
      materiaalId: "LIFT-02",
      categorie: "Liften",
      merkModel: "Sleeplift noordzijde",
      locatie: "Langs de hoofdbaan, noordkant",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2014-10-15",
      velden: { Type: "Sleeplift", Lengte: "160" },
      log: [{ actie: "Aandrijving controleren", dagen: 30, uur: 9, door: "Tim Verhoeven", opmerking: "Jaarlijkse controle aandrijfmotor en riemen." }],
    },
    {
      materiaalId: "LIFT-03",
      categorie: "Liften",
      merkModel: "Sleeplift zuidzijde",
      locatie: "Langs de hoofdbaan, zuidkant",
      status: "IN_REPARATIE",
      inGebruikSinds: "2014-10-15",
      velden: { Type: "Sleeplift", Lengte: "160" },
      log: [{ actie: "Noodstop testen", dagen: 2, uur: 11, minuut: 15, door: "Youssef El Amrani", opmerking: "Noodstop reageert vertraagd, onderdeel besteld.", statusNa: "IN_REPARATIE" }],
    },
    {
      materiaalId: "LIFT-04",
      categorie: "Liften",
      merkModel: "Lopende band instappiste",
      locatie: "Oefenhelling bij de ingang",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2019-03-01",
      velden: { Type: "Bandlift", Lengte: "25" },
      log: [{ actie: "Smeren", dagen: 5, uur: 8, door: "Sanne de Groot", opmerking: "Rollers en aandrijving gesmeerd." }],
    },
    {
      materiaalId: "LANT-01",
      categorie: "Verlichting",
      merkModel: "LED-mast",
      locatie: "Langs de baan, mast 1 (onderaan)",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2018-09-01",
      velden: { Lamptype: "LED" },
      log: [],
    },
    {
      materiaalId: "LANT-02",
      categorie: "Verlichting",
      merkModel: "LED-mast",
      locatie: "Langs de baan, mast 2",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2018-09-01",
      velden: { Lamptype: "LED" },
      log: [],
    },
    {
      materiaalId: "LANT-03",
      categorie: "Verlichting",
      merkModel: "LED-mast",
      locatie: "Langs de baan, mast 3",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2018-09-01",
      velden: { Lamptype: "LED" },
      log: [{ actie: "Lamp vervangen", dagen: 40, uur: 10, door: "Youssef El Amrani", opmerking: "Armatuur knipperde, lamp vervangen." }],
    },
    {
      materiaalId: "LANT-04",
      categorie: "Verlichting",
      merkModel: "LED-mast",
      locatie: "Langs de baan, mast 4",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2018-09-01",
      velden: { Lamptype: "LED" },
      log: [],
    },
    {
      materiaalId: "LANT-05",
      categorie: "Verlichting",
      merkModel: "LED-mast",
      locatie: "Langs de baan, mast 5",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2018-09-01",
      velden: { Lamptype: "LED" },
      log: [],
    },
    {
      materiaalId: "LANT-06",
      categorie: "Verlichting",
      merkModel: "LED-mast",
      locatie: "Langs de baan, mast 6",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2018-09-01",
      velden: { Lamptype: "LED" },
      log: [],
    },
    {
      materiaalId: "LANT-07",
      categorie: "Verlichting",
      merkModel: "LED-mast",
      locatie: "Bij de tubingbanen",
      status: "BUITEN_GEBRUIK",
      inGebruikSinds: "2018-09-01",
      velden: { Lamptype: "LED" },
      log: [{ actie: "Afkeuren", dagen: 3, uur: 16, door: "Tim Verhoeven", opmerking: "Mast beschadigd na aanrijding, wacht op nieuw onderdeel.", statusNa: "BUITEN_GEBRUIK", soort: "AFKEURING_GOEDGEKEURD" }],
    },
    {
      materiaalId: "LANT-08",
      categorie: "Verlichting",
      merkModel: "LED-mast",
      locatie: "Bij de ingang",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2018-09-01",
      velden: { Lamptype: "LED" },
      log: [],
    },
    {
      materiaalId: "TUBE-01",
      categorie: "Tubingbanen",
      merkModel: "Tubingbaan 1",
      locatie: "Tubinggebied, linkerbaan",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2020-12-01",
      velden: { Lengte: "45" },
      log: [{ actie: "Mat controleren", dagen: 7, uur: 9, door: "Sanne de Groot", opmerking: "Matten op naden gecontroleerd, geen bijzonderheden." }],
    },
    {
      materiaalId: "TUBE-02",
      categorie: "Tubingbanen",
      merkModel: "Tubingbaan 2",
      locatie: "Tubinggebied, middenbaan",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2020-12-01",
      velden: { Lengte: "45" },
      log: [],
    },
    {
      materiaalId: "TUBE-03",
      categorie: "Tubingbanen",
      merkModel: "Tubingbaan 3",
      locatie: "Tubinggebied, rechterbaan",
      status: "IN_GEBRUIK",
      inGebruikSinds: "2020-12-01",
      velden: { Lengte: "45" },
      log: [{ actie: "Rubber vervangen", dagen: 60, uur: 9, door: "Youssef El Amrani", opmerking: "Afremrubber aan het einde van de baan vervangen." }],
    },
  ],
};

/**
 * Baanschets: mattenbeheer van de skibaan. Het rooster hieronder is een
 * ILLUSTRATIEF, zelfbedacht voorbeeld — géén kopie van de echte baan. De
 * echte matindeling staat in categorie_grid.csv/leeftijd_overrides.json, die
 * (nog) niet zijn aangeleverd; zodra die er zijn vervangt een los migratie-
 * script dit rooster door de werkelijke ~1125 matten over 7 secties.
 *
 * Rotatiegeschiedenis en nieuwe-matten-opname hieronder zijn wél de echte
 * teksten uit build_baanschets.py, woordelijk overgenomen.
 */
export const BAANSCHETS = {
  instellingen: { breedteM: 2.17, hoogteM: 1.45, basisleeftijdSeizoenen: 6 },
  aantalRijen: 20,
  aantalKolommen: 16,
  // [nr, omschrijving, [[rijVan, rijTot, kolomVan, kolomTot], ...]]
  secties: [
    { nr: 1, omschrijving: "Bovenbaan noord", bereiken: [[1, 6, 1, 8]] },
    { nr: 2, omschrijving: "Middenbaan noord", bereiken: [[7, 12, 1, 8]] },
    { nr: 3, omschrijving: "Onderbaan noord", bereiken: [[13, 16, 1, 8]] },
    { nr: 4, omschrijving: "Onderbaan breed", bereiken: [[17, 20, 1, 16]] },
    { nr: 5, omschrijving: "Onderbaan zuid", bereiken: [[13, 16, 9, 12]] },
    { nr: 6, omschrijving: "Middenbaan zuid", bereiken: [[7, 12, 9, 16]] },
    { nr: 7, omschrijving: "Bovenbaan zuid", bereiken: [[1, 6, 9, 16]] },
  ],
  // Losse overrides op het gegenereerde rooster: leeftijd/opmerking/gemarkeerd.
  overrides: {
    "3_3": { leeftijd: 1, opmerking: "Nieuwe mat (zie Nieuwe matten opname 2026/27)." },
    "3_4": { leeftijd: 1, opmerking: "Nieuwe mat (zie Nieuwe matten opname 2026/27)." },
    "1_2": {
      gemarkeerd: true,
      opmerking:
        "Geroteerd seizoen 2025/26: fysiek gewisseld tussen sectie 1 en sectie 7. Zie rotatiegeschiedenis.",
    },
    "1_10": {
      gemarkeerd: true,
      opmerking:
        "Geroteerd seizoen 2025/26: fysiek gewisseld tussen sectie 1 en sectie 7. Zie rotatiegeschiedenis.",
    },
    "9_2": {
      gemarkeerd: true,
      opmerking:
        "Geroteerd seizoen 2026/27: fysiek gewisseld tussen sectie 2 en sectie 6. Zie rotatiegeschiedenis.",
    },
    "9_12": {
      gemarkeerd: true,
      opmerking:
        "Geroteerd seizoen 2026/27: fysiek gewisseld tussen sectie 2 en sectie 6. Zie rotatiegeschiedenis.",
      categorie: "SkiLicht",
    },
  },
  rotatiegeschiedenis: [
    {
      seizoen: "2025/26",
      van: "1",
      naar: "7",
      toelichting: "Rest sectie 1 geruild met sectie 7",
    },
    {
      seizoen: "2026/27",
      van: "2",
      naar: "Reserve",
      toelichting:
        "50 matten in sectie 2 (AB23:AE34, AB35, AE35) vervangen door nieuwe matten (leeftijd 1). " +
        "De weggehaalde matten (leeftijd 6) zijn toegevoegd aan de reservevoorraad.",
    },
    {
      seizoen: "2026/27",
      van: "2",
      naar: "6",
      toelichting:
        "Deel van sectie 2 (AA24:AA42) fysiek omgewisseld met deel van sectie 6/8 deelgebieden " +
        "(W78:W87, X79:X87). Beide gebieden stonden op basisleeftijd (6 seizoenen), dus geen " +
        "aanpassing nodig in het leeftijdraster.",
    },
    {
      seizoen: "2026/27",
      van: "2",
      naar: "6",
      toelichting:
        "Deel van sectie 2 (AB36:AB42, AE36:AE42) fysiek omgewisseld met deel van sectie 6/8 " +
        "deelgebieden (W71:W77, X72:X78). Beide gebieden stonden op basisleeftijd (6 seizoenen), " +
        "dus geen aanpassing nodig in het leeftijdraster.",
    },
    {
      seizoen: "2026/27",
      van: "2",
      naar: "6",
      toelichting:
        "Deel van sectie 2 (AC35:AD42) fysiek omgewisseld met deel van sectie 6/8 deelgebieden " +
        "(W63:X70). Beide gebieden stonden op basisleeftijd (6 seizoenen), dus geen aanpassing " +
        "nodig in het leeftijdraster.",
    },
  ],
  nieuweMatten: [
    {
      seizoen: "2026/27",
      aantal: 50,
      leeftijd: 6,
      vanuit: "2",
      toelichting:
        "Vervangen door nieuwe matten in AB23:AE34, AB35, AE35, zie Rotatiegeschiedenis 2026/27.",
    },
    {
      seizoen: "2026/27",
      aantal: 1,
      leeftijd: 6,
      vanuit: "6",
      toelichting:
        "SkiLicht mat op X71 vervangen door SkiMidden mat (categorie gewijzigd, leeftijd ongewijzigd).",
    },
    {
      seizoen: "2026/27",
      aantal: 1,
      leeftijd: 6,
      vanuit: "6",
      toelichting:
        "SkiMidden mat op X78 vervangen door SkiLicht mat (categorie gewijzigd, leeftijd ongewijzigd).",
    },
  ],
};

/**
 * Genereert het illustratieve rooster: per sectie overwegend Ski-matten, met
 * een rand van Lift-/Rubbermatten (net als bij een echte piste, waar de
 * randen van liften en opstapplekken een andere mat hebben dan de pistevloer
 * zelf). Determinstisch — geen willekeur, zodat een her-seed identiek is.
 */
export function genereerBaanschetsRooster() {
  const cellen = new Map(); // "rij_kolom" -> { categorie }
  for (const sectie of BAANSCHETS.secties) {
    for (const [rijVan, rijTot, kolomVan, kolomTot] of sectie.bereiken) {
      for (let rij = rijVan; rij <= rijTot; rij++) {
        for (let kolom = kolomVan; kolom <= kolomTot; kolom++) {
          const opRand =
            rij === rijVan || rij === rijTot || kolom === kolomVan || kolom === kolomTot;
          let categorie;
          if (opRand && (rij + kolom) % 5 === 0) categorie = "Rubber";
          else if (opRand) categorie = kolom % 2 === 0 ? "LiftLicht" : "LiftDonker";
          else if ((rij + kolom) % 7 === 0) categorie = "SkiDonker";
          else if ((rij + kolom) % 3 === 0) categorie = "SkiLicht";
          else categorie = "SkiMidden";
          cellen.set(`${rij}_${kolom}`, { categorie });
        }
      }
    }
  }
  for (const [sleutel, override] of Object.entries(BAANSCHETS.overrides)) {
    const bestaand = cellen.get(sleutel) ?? {};
    cellen.set(sleutel, { ...bestaand, ...override });
  }
  return cellen;
}

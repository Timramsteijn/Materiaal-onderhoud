import type { APIRoute } from "astro";
import { desc } from "drizzle-orm";

import { db } from "@/lib/context";
import { baanschetsNieuweMatten, baanschetsRotaties } from "@/db/schema";
import {
  haalBaanschetsCellen,
  haalBaanschetsInstellingen,
  haalBaanschetsSecties,
  m2PerCategorie,
  oppervlaktePerMat,
  sectiePosities,
  telPerCategorie,
  effectieveLeeftijd,
} from "@/lib/baanschets";
import { buildBaanschetsWorkbook } from "@/lib/baanschets-excel";

/** GET /api/baanschets-export — exporteert legenda, secties, rooster en logs. */
export const GET: APIRoute = async ({ locals }) => {
  if (!locals.medewerker) return new Response("Niet ingelogd.", { status: 401 });

  const [instellingen, cellen, secties, rotaties, nieuweMatten] = await Promise.all([
    haalBaanschetsInstellingen(),
    haalBaanschetsCellen(),
    haalBaanschetsSecties(),
    db().select().from(baanschetsRotaties).orderBy(desc(baanschetsRotaties.tijdstip)),
    db().select().from(baanschetsNieuweMatten).orderBy(desc(baanschetsNieuweMatten.tijdstip)),
  ]);

  const oppervlaktePerMatM2 = oppervlaktePerMat(instellingen);
  const totalen = telPerCategorie(cellen);
  const m2 = m2PerCategorie(totalen, oppervlaktePerMatM2);

  const buffer = buildBaanschetsWorkbook({
    totalen,
    m2,
    breedteM: instellingen.breedteM,
    hoogteM: instellingen.hoogteM,
    basisleeftijdSeizoenen: instellingen.basisleeftijdSeizoenen,
    secties: secties.map((s) => {
      const posities = sectiePosities(s);
      const sectieTotalen = telPerCategorie(cellen, posities);
      return {
        nr: s.nr,
        omschrijving: s.omschrijving,
        celbereik: s.bereiken
          .map((b) => `rij ${b.rijVan}-${b.rijTot}, kolom ${b.kolomVan}-${b.kolomTot}`)
          .join("; "),
        totalen: sectieTotalen,
        totaalM2: m2PerCategorie(sectieTotalen, oppervlaktePerMatM2).totaal,
      };
    }),
    cellen: cellen.map((c) => ({
      rij: c.rij,
      kolom: c.kolom,
      categorie: c.categorie,
      leeftijdEffectief: effectieveLeeftijd(c, instellingen.basisleeftijdSeizoenen),
      opmerking: c.opmerking,
      gemarkeerd: c.gemarkeerd,
    })),
    rotaties: rotaties.map((r) => ({
      seizoen: r.seizoen,
      a: r.van,
      b: r.naar,
      toelichting: r.toelichting,
      medewerkerNaam: r.medewerkerNaam,
      tijdstip: r.tijdstip,
    })),
    nieuweMatten: nieuweMatten.map((n) => ({
      seizoen: n.seizoen,
      a: n.vanuit,
      b: "",
      aantal: n.aantal,
      leeftijdBijOpname: n.leeftijdBijOpname,
      toelichting: n.toelichting,
      medewerkerNaam: n.medewerkerNaam,
      tijdstip: n.tijdstip,
    })),
  });

  const datum = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Baanschets_${datum}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
};

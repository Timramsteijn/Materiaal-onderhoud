import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { and, eq, ne } from "drizzle-orm";

import { db } from "@/lib/context";
import { vereisBeheerder } from "@/lib/guard";
import { nieuwId } from "@/lib/id";
import { haalBaanschetsInstellingen } from "@/lib/baanschets";
import {
  baanschetsCellen,
  baanschetsInstellingen,
  baanschetsNieuweMatten,
  baanschetsRotaties,
  baanschetsSecties,
  baanschetsSectieBereiken,
  beheerlog,
  BAANSCHETS_CATEGORIEEN,
} from "@/db/schema";

async function logBeheer(medewerkerId: string, wat: string, detail: object) {
  await db()
    .insert(beheerlog)
    .values({ id: nieuwId("bl"), medewerkerId, wat, detail: JSON.stringify(detail), tijdstip: new Date() });
}

/**
 * Eén mat bewerken: categorie, leeftijd, opmerking en/of de "fysiek
 * geroteerd"-markering. Leeg categorie-veld verwijdert de mat uit het
 * rooster (lege cel = geen mat); leeftijd leeg laten betekent "volgt de
 * basisleeftijd". Elke wijziging komt met van/naar in het beheerlog, net als
 * elke andere beheerwijziging op deze site.
 */
export const bewerkBaanschetsCel = defineAction({
  accept: "form",
  input: z.object({
    rij: z.coerce.number().int().min(1),
    kolom: z.coerce.number().int().min(1),
    categorie: z.union([z.enum(BAANSCHETS_CATEGORIEEN), z.literal("")]).optional(),
    leeftijd: z.string().trim().optional(),
    opmerking: z.string().trim().max(500).optional(),
    gemarkeerd: z.coerce.boolean().optional(),
    toelichting: z.string().trim().max(500).optional(),
  }),
  handler: async (invoer, context) => {
    const beheerder = await vereisBeheerder(context);

    const instellingen = await haalBaanschetsInstellingen();
    if (invoer.rij > instellingen.aantalRijen || invoer.kolom > instellingen.aantalKolommen) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: `Cel (${invoer.rij}, ${invoer.kolom}) valt buiten het rooster (${instellingen.aantalRijen}×${instellingen.aantalKolommen}).`,
      });
    }

    let leeftijd: number | null = null;
    if (invoer.leeftijd && invoer.leeftijd.trim()) {
      const getal = Number(invoer.leeftijd);
      if (!Number.isInteger(getal) || getal < 0) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Leeftijd moet een geheel getal van 0 of hoger zijn.",
        });
      }
      leeftijd = getal;
    }

    const bestaand = await db().query.baanschetsCellen.findFirst({
      where: and(eq(baanschetsCellen.rij, invoer.rij), eq(baanschetsCellen.kolom, invoer.kolom)),
    });

    // Leeg categorie-veld: de mat verdwijnt (lege cel = geen mat op die plek).
    if (!invoer.categorie) {
      if (bestaand) {
        await db().delete(baanschetsCellen).where(eq(baanschetsCellen.id, bestaand.id));
        await logBeheer(beheerder.id, "Baanschets-cel verwijderd", {
          rij: invoer.rij,
          kolom: invoer.kolom,
          van: bestaand.categorie,
          toelichting: invoer.toelichting ?? "",
        });
      }
      return { ok: true as const };
    }

    const wijzigingen: Record<string, { van: unknown; naar: unknown }> = {};
    if (!bestaand || bestaand.categorie !== invoer.categorie) {
      wijzigingen.categorie = { van: bestaand?.categorie ?? null, naar: invoer.categorie };
    }
    if (!bestaand || bestaand.leeftijd !== leeftijd) {
      wijzigingen.leeftijd = { van: bestaand?.leeftijd ?? null, naar: leeftijd };
    }

    await db()
      .insert(baanschetsCellen)
      .values({
        id: nieuwId("cel"),
        rij: invoer.rij,
        kolom: invoer.kolom,
        categorie: invoer.categorie,
        leeftijd,
        opmerking: invoer.opmerking ?? "",
        gemarkeerd: invoer.gemarkeerd ?? false,
      })
      .onConflictDoUpdate({
        target: [baanschetsCellen.rij, baanschetsCellen.kolom],
        set: {
          categorie: invoer.categorie,
          leeftijd,
          opmerking: invoer.opmerking ?? "",
          gemarkeerd: invoer.gemarkeerd ?? false,
        },
      });

    if (Object.keys(wijzigingen).length > 0) {
      await logBeheer(beheerder.id, "Baanschets-cel gewijzigd", {
        rij: invoer.rij,
        kolom: invoer.kolom,
        ...wijzigingen,
        toelichting: invoer.toelichting ?? "",
      });
    }

    return { ok: true as const };
  },
});

export const zetBaanschetsInstellingen = defineAction({
  accept: "form",
  input: z.object({
    breedteM: z.coerce.number().positive(),
    hoogteM: z.coerce.number().positive(),
    basisleeftijdSeizoenen: z.coerce.number().int().min(0),
  }),
  handler: async (invoer, context) => {
    const beheerder = await vereisBeheerder(context);
    await haalBaanschetsInstellingen(); // zorgt dat de singleton-rij bestaat
    await db()
      .update(baanschetsInstellingen)
      .set(invoer)
      .where(eq(baanschetsInstellingen.id, "singleton"));
    await logBeheer(beheerder.id, "Baanschets-instellingen gewijzigd", invoer);
    return { ok: true as const };
  },
});

export const voegBaanschetsSectieToe = defineAction({
  accept: "form",
  input: z.object({
    nr: z.coerce.number().int().min(1),
    omschrijving: z.string().trim().max(120).optional(),
  }),
  handler: async ({ nr, omschrijving }, context) => {
    const beheerder = await vereisBeheerder(context);

    const bestaat = await db().query.baanschetsSecties.findFirst({
      where: eq(baanschetsSecties.nr, nr),
    });
    if (bestaat) {
      throw new ActionError({ code: "CONFLICT", message: `Sectie ${nr} bestaat al.` });
    }

    await db()
      .insert(baanschetsSecties)
      .values({
        id: nieuwId("sct"),
        nr,
        omschrijving: omschrijving ?? "",
        sortering: nr,
      });
    await logBeheer(beheerder.id, "Baanschets-sectie toegevoegd", { nr, omschrijving });
    return { ok: true as const };
  },
});

/**
 * Voegt één rechthoekig celbereik toe aan een sectie. Overlap met een bereik
 * van een ándere sectie blokkeert niet (dat leidde in het oude Excel-bestand
 * tot dubbeltellingen), maar komt wél terug als waarschuwing in de UI.
 */
export const voegBaanschetsSectieBereikToe = defineAction({
  accept: "form",
  input: z.object({
    sectieId: z.string().min(1),
    rijVan: z.coerce.number().int().min(1),
    rijTot: z.coerce.number().int().min(1),
    kolomVan: z.coerce.number().int().min(1),
    kolomTot: z.coerce.number().int().min(1),
  }),
  handler: async (invoer, context) => {
    const beheerder = await vereisBeheerder(context);

    const sectie = await db().query.baanschetsSecties.findFirst({
      where: eq(baanschetsSecties.id, invoer.sectieId),
    });
    if (!sectie) throw new ActionError({ code: "NOT_FOUND", message: "Sectie niet gevonden." });

    if (invoer.rijVan > invoer.rijTot || invoer.kolomVan > invoer.kolomTot) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "'Van' moet kleiner of gelijk zijn aan 'tot'.",
      });
    }

    const instellingen = await haalBaanschetsInstellingen();
    if (
      invoer.rijTot > instellingen.aantalRijen ||
      invoer.kolomTot > instellingen.aantalKolommen
    ) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: `Het celbereik valt buiten het rooster (${instellingen.aantalRijen}×${instellingen.aantalKolommen}).`,
      });
    }

    // Overlap met bereiken van ándere secties: waarschuwen, niet blokkeren.
    const andereBereiken = await db()
      .select({ bereik: baanschetsSectieBereiken, nr: baanschetsSecties.nr })
      .from(baanschetsSectieBereiken)
      .innerJoin(baanschetsSecties, eq(baanschetsSecties.id, baanschetsSectieBereiken.sectieId))
      .where(ne(baanschetsSectieBereiken.sectieId, invoer.sectieId));

    const overlapt = andereBereiken.filter(
      ({ bereik: b }) =>
        invoer.rijVan <= b.rijTot &&
        invoer.rijTot >= b.rijVan &&
        invoer.kolomVan <= b.kolomTot &&
        invoer.kolomTot >= b.kolomVan
    );

    await db()
      .insert(baanschetsSectieBereiken)
      .values({
        id: nieuwId("bereik"),
        sectieId: invoer.sectieId,
        rijVan: invoer.rijVan,
        rijTot: invoer.rijTot,
        kolomVan: invoer.kolomVan,
        kolomTot: invoer.kolomTot,
      });
    await logBeheer(beheerder.id, "Baanschets-sectiebereik toegevoegd", {
      sectie: sectie.nr,
      ...invoer,
    });

    return {
      ok: true as const,
      waarschuwing: overlapt.length
        ? `Dit bereik overlapt met sectie ${[...new Set(overlapt.map((o) => o.nr))].join(", ")} — dat kan dubbeltellingen geven.`
        : null,
    };
  },
});

export const verwijderBaanschetsSectieBereik = defineAction({
  accept: "form",
  input: z.object({ bereikId: z.string().min(1) }),
  handler: async ({ bereikId }, context) => {
    const beheerder = await vereisBeheerder(context);
    const bereik = await db().query.baanschetsSectieBereiken.findFirst({
      where: eq(baanschetsSectieBereiken.id, bereikId),
    });
    if (!bereik) return { ok: false as const };

    await db().delete(baanschetsSectieBereiken).where(eq(baanschetsSectieBereiken.id, bereikId));
    await logBeheer(beheerder.id, "Baanschets-sectiebereik verwijderd", { bereikId });
    return { ok: true as const };
  },
});

export const voegBaanschetsRotatieToe = defineAction({
  accept: "form",
  input: z.object({
    seizoen: z.string().trim().min(1).max(20),
    van: z.string().trim().min(1).max(40),
    naar: z.string().trim().min(1).max(40),
    toelichting: z.string().trim().max(1000).optional(),
  }),
  handler: async (invoer, context) => {
    const beheerder = await vereisBeheerder(context);
    await db()
      .insert(baanschetsRotaties)
      .values({
        id: nieuwId("rot"),
        seizoen: invoer.seizoen,
        van: invoer.van,
        naar: invoer.naar,
        toelichting: invoer.toelichting ?? "",
        medewerkerId: beheerder.id,
        medewerkerNaam: beheerder.naam,
        tijdstip: new Date(),
      });
    return { ok: true as const };
  },
});

export const voegBaanschetsNieuweMattenToe = defineAction({
  accept: "form",
  input: z.object({
    seizoen: z.string().trim().min(1).max(20),
    aantal: z.coerce.number().int().min(1),
    leeftijdBijOpname: z.coerce.number().int().min(0),
    vanuit: z.string().trim().max(40).optional(),
    toelichting: z.string().trim().max(1000).optional(),
  }),
  handler: async (invoer, context) => {
    const beheerder = await vereisBeheerder(context);
    await db()
      .insert(baanschetsNieuweMatten)
      .values({
        id: nieuwId("nm"),
        seizoen: invoer.seizoen,
        aantal: invoer.aantal,
        leeftijdBijOpname: invoer.leeftijdBijOpname,
        vanuit: invoer.vanuit ?? "",
        toelichting: invoer.toelichting ?? "",
        medewerkerId: beheerder.id,
        medewerkerNaam: beheerder.naam,
        tijdstip: new Date(),
      });
    return { ok: true as const };
  },
});

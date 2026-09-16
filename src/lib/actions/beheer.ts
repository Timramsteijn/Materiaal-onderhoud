"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBeheerder } from "@/lib/actions/guard";
import type { VeldType } from "@prisma/client";

export type BeheerState = { fout?: string } | undefined;

async function logBeheer(medewerkerId: string, wat: string, detail: object) {
  await prisma.beheerLog.create({ data: { medewerkerId, wat, detail } });
}

function ververs(slug: string) {
  revalidatePath(`/${slug}/beheer`);
  revalidatePath(`/${slug}/materiaal`);
  revalidatePath(`/${slug}/overzicht`);
}

/* ---------- categorieën ---------- */

export async function voegCategorieToe(
  _prev: BeheerState,
  formData: FormData
): Promise<BeheerState> {
  const beheerder = await requireBeheerder();
  const parsed = z
    .object({ onderdeelId: z.string().min(1), naam: z.string().trim().min(1).max(60) })
    .safeParse({ onderdeelId: formData.get("onderdeelId"), naam: formData.get("naam") });
  if (!parsed.success) return { fout: "Vul een naam in." };

  const onderdeel = await prisma.onderdeel.findUnique({ where: { id: parsed.data.onderdeelId } });
  if (!onderdeel) return { fout: "Onderdeel niet gevonden." };

  const bestaat = await prisma.categorie.findUnique({
    where: { onderdeelId_naam: { onderdeelId: onderdeel.id, naam: parsed.data.naam } },
  });
  if (bestaat) {
    if (!bestaat.archivedAt) return { fout: "Deze categorie bestaat al." };
    await prisma.categorie.update({ where: { id: bestaat.id }, data: { archivedAt: null } });
  } else {
    const aantal = await prisma.categorie.count({ where: { onderdeelId: onderdeel.id } });
    await prisma.categorie.create({
      data: { onderdeelId: onderdeel.id, naam: parsed.data.naam, sortering: aantal },
    });
  }

  await logBeheer(beheerder.id, "Categorie toegevoegd", { naam: parsed.data.naam });
  ververs(onderdeel.slug);
  return undefined;
}

/** Verwijderen is archiveren: bestaande logregels blijven ongemoeid. */
export async function archiveerCategorie(categorieId: string): Promise<void> {
  const beheerder = await requireBeheerder();
  const categorie = await prisma.categorie.findUnique({
    where: { id: categorieId },
    include: { onderdeel: { select: { slug: true } } },
  });
  if (!categorie) return;

  await prisma.categorie.update({ where: { id: categorieId }, data: { archivedAt: new Date() } });
  await logBeheer(beheerder.id, "Categorie gearchiveerd", { naam: categorie.naam });
  ververs(categorie.onderdeel.slug);
}

/* ---------- onderhoudsacties ---------- */

export async function voegActieToe(_prev: BeheerState, formData: FormData): Promise<BeheerState> {
  const beheerder = await requireBeheerder();
  const parsed = z
    .object({ categorieId: z.string().min(1), naam: z.string().trim().min(1).max(80) })
    .safeParse({ categorieId: formData.get("categorieId"), naam: formData.get("naam") });
  if (!parsed.success) return { fout: "Vul een naam in." };

  const categorie = await prisma.categorie.findUnique({
    where: { id: parsed.data.categorieId },
    include: { onderdeel: { select: { slug: true } } },
  });
  if (!categorie) return { fout: "Categorie niet gevonden." };

  const bestaand = await prisma.onderhoudsActie.findFirst({
    where: { categorieId: categorie.id, naam: parsed.data.naam },
  });
  if (bestaand && !bestaand.archivedAt) return { fout: "Deze actie bestaat al." };

  if (bestaand) {
    await prisma.onderhoudsActie.update({ where: { id: bestaand.id }, data: { archivedAt: null } });
  } else {
    const aantal = await prisma.onderhoudsActie.count({ where: { categorieId: categorie.id } });
    await prisma.onderhoudsActie.create({
      data: { categorieId: categorie.id, naam: parsed.data.naam, sortering: aantal },
    });
  }

  await logBeheer(beheerder.id, "Onderhoudsactie toegevoegd", {
    categorie: categorie.naam,
    naam: parsed.data.naam,
  });
  ververs(categorie.onderdeel.slug);
  return undefined;
}

export async function archiveerActie(actieId: string): Promise<void> {
  const beheerder = await requireBeheerder();
  const actie = await prisma.onderhoudsActie.findUnique({
    where: { id: actieId },
    include: { categorie: { include: { onderdeel: { select: { slug: true } } } } },
  });
  if (!actie) return;

  await prisma.onderhoudsActie.update({ where: { id: actieId }, data: { archivedAt: new Date() } });
  await logBeheer(beheerder.id, "Onderhoudsactie gearchiveerd", {
    categorie: actie.categorie.naam,
    naam: actie.naam,
  });
  ververs(actie.categorie.onderdeel.slug);
}

/* ---------- velddefinities ---------- */

export async function voegVeldToe(_prev: BeheerState, formData: FormData): Promise<BeheerState> {
  const beheerder = await requireBeheerder();
  const parsed = z
    .object({
      categorieId: z.string().min(1),
      naam: z.string().trim().min(1).max(80),
      type: z.enum(["TEKST", "GETAL", "BEREIK", "DATUM", "KEUZE"]).default("TEKST"),
      eenheid: z.string().trim().max(12).optional(),
    })
    .safeParse({
      categorieId: formData.get("categorieId"),
      naam: formData.get("naam"),
      type: formData.get("type") || "TEKST",
      eenheid: formData.get("eenheid") || undefined,
    });
  if (!parsed.success) return { fout: "Vul een naam in." };

  const categorie = await prisma.categorie.findUnique({
    where: { id: parsed.data.categorieId },
    include: { onderdeel: { select: { slug: true } } },
  });
  if (!categorie) return { fout: "Categorie niet gevonden." };

  const bestaand = await prisma.veldDefinitie.findFirst({
    where: { categorieId: categorie.id, naam: parsed.data.naam },
  });
  if (bestaand && !bestaand.archivedAt) return { fout: "Dit veld bestaat al." };

  if (bestaand) {
    await prisma.veldDefinitie.update({
      where: { id: bestaand.id },
      data: { archivedAt: null, type: parsed.data.type as VeldType, eenheid: parsed.data.eenheid ?? null },
    });
  } else {
    const aantal = await prisma.veldDefinitie.count({ where: { categorieId: categorie.id } });
    await prisma.veldDefinitie.create({
      data: {
        categorieId: categorie.id,
        naam: parsed.data.naam,
        type: parsed.data.type as VeldType,
        eenheid: parsed.data.eenheid ?? null,
        sortering: aantal,
      },
    });
  }

  await logBeheer(beheerder.id, "Veld toegevoegd", {
    categorie: categorie.naam,
    naam: parsed.data.naam,
  });
  ververs(categorie.onderdeel.slug);
  return undefined;
}

export async function archiveerVeld(veldId: string): Promise<void> {
  const beheerder = await requireBeheerder();
  const veld = await prisma.veldDefinitie.findUnique({
    where: { id: veldId },
    include: { categorie: { include: { onderdeel: { select: { slug: true } } } } },
  });
  if (!veld) return;

  await prisma.veldDefinitie.update({ where: { id: veldId }, data: { archivedAt: new Date() } });
  await logBeheer(beheerder.id, "Veld gearchiveerd", {
    categorie: veld.categorie.naam,
    naam: veld.naam,
  });
  ververs(veld.categorie.onderdeel.slug);
}

/* ---------- medewerkers ---------- */

export async function voegMedewerkerToe(
  _prev: BeheerState,
  formData: FormData
): Promise<BeheerState> {
  const beheerder = await requireBeheerder();
  const parsed = z
    .object({
      slug: z.string().min(1),
      naam: z.string().trim().min(1).max(80),
      gebruikersnaam: z
        .string()
        .trim()
        .min(3)
        .max(40)
        .transform((v) => v.toLowerCase()),
      wachtwoord: z.string().min(8).max(100),
      rol: z.enum(["BEHEERDER", "MEDEWERKER", "STAGIAIR"]),
      functie: z.string().trim().max(80).optional(),
    })
    .safeParse({
      slug: formData.get("slug"),
      naam: formData.get("naam"),
      gebruikersnaam: formData.get("gebruikersnaam"),
      wachtwoord: formData.get("wachtwoord"),
      rol: formData.get("rol"),
      functie: formData.get("functie") || undefined,
    });
  if (!parsed.success) {
    return { fout: "Controleer de velden — wachtwoord minimaal 8 tekens." };
  }

  const bestaat = await prisma.medewerker.findUnique({
    where: { gebruikersnaam: parsed.data.gebruikersnaam },
  });
  if (bestaat) return { fout: "Deze gebruikersnaam is al in gebruik." };

  await prisma.medewerker.create({
    data: {
      naam: parsed.data.naam,
      gebruikersnaam: parsed.data.gebruikersnaam,
      wachtwoordHash: await bcrypt.hash(parsed.data.wachtwoord, 12),
      rol: parsed.data.rol,
      functie: parsed.data.functie ?? "",
    },
  });

  await logBeheer(beheerder.id, "Medewerker toegevoegd", { naam: parsed.data.naam });
  ververs(parsed.data.slug);
  return undefined;
}

export async function zetMedewerkerActief(
  medewerkerId: string,
  actief: boolean,
  slug: string
): Promise<void> {
  const beheerder = await requireBeheerder();
  if (medewerkerId === beheerder.id) return;

  const medewerker = await prisma.medewerker.update({
    where: { id: medewerkerId },
    data: { actief },
  });
  await logBeheer(beheerder.id, actief ? "Medewerker geactiveerd" : "Medewerker gedeactiveerd", {
    naam: medewerker.naam,
  });
  ververs(slug);
}

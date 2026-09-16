"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireMedewerker, requireBeheerder } from "@/lib/actions/guard";

export type MateriaalState = { fout?: string } | undefined;

const nieuwSchema = z.object({
  onderdeelId: z.string().min(1),
  categorieId: z.string().min(1),
  // Het ID moet exact overeenkomen met de sticker; nooit automatisch genereren.
  materiaalId: z.string().trim().min(1).max(40),
  merkModel: z.string().trim().min(1).max(160),
  locatie: z.string().trim().max(120).optional(),
  inGebruikSinds: z.coerce.date(),
});

export async function maakMateriaal(
  _prev: MateriaalState,
  formData: FormData
): Promise<MateriaalState> {
  await requireMedewerker();

  const parsed = nieuwSchema.safeParse({
    onderdeelId: formData.get("onderdeelId"),
    categorieId: formData.get("categorieId"),
    materiaalId: formData.get("materiaalId"),
    merkModel: formData.get("merkModel"),
    locatie: formData.get("locatie") || undefined,
    inGebruikSinds: formData.get("inGebruikSinds") || new Date(),
  });
  if (!parsed.success) return { fout: "Controleer de ingevulde velden." };

  const [onderdeel, categorie, bestaat] = await Promise.all([
    prisma.onderdeel.findUnique({ where: { id: parsed.data.onderdeelId } }),
    prisma.categorie.findUnique({ where: { id: parsed.data.categorieId } }),
    prisma.materiaal.findUnique({
      where: {
        onderdeelId_materiaalId: {
          onderdeelId: parsed.data.onderdeelId,
          materiaalId: parsed.data.materiaalId,
        },
      },
    }),
  ]);

  if (!onderdeel) return { fout: "Onderdeel niet gevonden." };
  if (!categorie || categorie.onderdeelId !== onderdeel.id) {
    return { fout: "Onbekende categorie voor dit onderdeel." };
  }
  if (bestaat) {
    return { fout: `Materiaal-ID "${parsed.data.materiaalId}" bestaat al in ${onderdeel.naam}.` };
  }

  // Nieuw materiaal start altijd op "In gebruik"; er is geen statusveld.
  await prisma.materiaal.create({
    data: {
      materiaalId: parsed.data.materiaalId,
      onderdeelId: onderdeel.id,
      categorieId: categorie.id,
      merkModel: parsed.data.merkModel,
      locatie: parsed.data.locatie ?? "",
      inGebruikSinds: parsed.data.inGebruikSinds,
      status: "IN_GEBRUIK",
      veldwaarden: {},
    },
  });

  revalidatePath(`/${onderdeel.slug}/materiaal`);
  revalidatePath(`/${onderdeel.slug}/overzicht`);
  redirect(`/${onderdeel.slug}/materiaal/${encodeURIComponent(parsed.data.materiaalId)}`);
}

const bewerkSchema = z.object({
  materiaalDbId: z.string().min(1),
  merkModel: z.string().trim().min(1).max(160),
  locatie: z.string().trim().max(120).optional(),
  inGebruikSinds: z.coerce.date(),
});

/** Bewerkt de algemene gegevens plus de categorie-eigen velden. */
export async function bewerkMateriaal(
  _prev: MateriaalState,
  formData: FormData
): Promise<MateriaalState> {
  await requireMedewerker();

  const parsed = bewerkSchema.safeParse({
    materiaalDbId: formData.get("materiaalDbId"),
    merkModel: formData.get("merkModel"),
    locatie: formData.get("locatie") || undefined,
    inGebruikSinds: formData.get("inGebruikSinds"),
  });
  if (!parsed.success) return { fout: "Controleer de ingevulde velden." };

  const materiaal = await prisma.materiaal.findUnique({
    where: { id: parsed.data.materiaalDbId },
    include: {
      onderdeel: { select: { slug: true } },
      categorie: { include: { velden: { where: { archivedAt: null } } } },
    },
  });
  if (!materiaal) return { fout: "Materiaal niet gevonden." };

  // Waarden van de categorie-eigen velden komen binnen als veld:{id}
  const veldwaarden: Record<string, string> = {};
  for (const veld of materiaal.categorie.velden) {
    const waarde = formData.get(`veld:${veld.id}`);
    if (typeof waarde === "string" && waarde.trim()) {
      veldwaarden[veld.id] = waarde.trim();
    }
  }

  await prisma.materiaal.update({
    where: { id: materiaal.id },
    data: {
      merkModel: parsed.data.merkModel,
      locatie: parsed.data.locatie ?? "",
      inGebruikSinds: parsed.data.inGebruikSinds,
      veldwaarden,
    },
  });

  revalidatePath(`/${materiaal.onderdeel.slug}/materiaal`);
  revalidatePath(
    `/${materiaal.onderdeel.slug}/materiaal/${encodeURIComponent(materiaal.materiaalId)}`
  );
  return undefined;
}

export async function verwijderMateriaal(materiaalDbId: string): Promise<void> {
  const beheerder = await requireBeheerder();

  const materiaal = await prisma.materiaal.findUnique({
    where: { id: materiaalDbId },
    include: { onderdeel: { select: { slug: true } } },
  });
  if (!materiaal) return;

  await prisma.$transaction([
    prisma.materiaal.delete({ where: { id: materiaal.id } }),
    prisma.beheerLog.create({
      data: {
        medewerkerId: beheerder.id,
        wat: "Materiaal verwijderd",
        detail: { materiaalId: materiaal.materiaalId, merkModel: materiaal.merkModel },
      },
    }),
  ]);

  revalidatePath(`/${materiaal.onderdeel.slug}/materiaal`);
  redirect(`/${materiaal.onderdeel.slug}/materiaal`);
}

/**
 * Zoekt een gescand of ingetypt Materiaal-ID binnen één onderdeel. Geeft null
 * als het niet bestaat — de scanpagina toont dan een foutmelding en navigeert
 * bewust niet automatisch door.
 */
export async function zoekMateriaalId(
  onderdeelId: string,
  ruwId: string
): Promise<string | null> {
  await requireMedewerker();
  const materiaalId = ruwId.trim().toUpperCase();
  if (!materiaalId) return null;

  const gevonden = await prisma.materiaal.findUnique({
    where: { onderdeelId_materiaalId: { onderdeelId, materiaalId } },
    select: { materiaalId: true },
  });
  return gevonden?.materiaalId ?? null;
}

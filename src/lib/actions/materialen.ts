"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, requireDutyManager, ActionError } from "@/lib/actions/guard";
import { canDeleteMaterial, canSetOutOfService } from "@/lib/permissions";
import type { MaterialStatus } from "@prisma/client";

export type FormState = { error?: string } | undefined;

async function nextMaterialId(categoryId: string): Promise<string> {
  const category = await prisma.category.findUniqueOrThrow({
    where: { id: categoryId },
  });

  const bestaande = await prisma.material.findMany({
    where: { categoryId },
    select: { id: true },
  });

  let hoogste = 0;
  const prefixMatch = new RegExp(`^${category.prefix}-(\\d+)$`);
  for (const m of bestaande) {
    const match = m.id.match(prefixMatch);
    if (match) hoogste = Math.max(hoogste, parseInt(match[1], 10));
  }

  const volgende = hoogste + 1;
  return `${category.prefix}-${String(volgende).padStart(3, "0")}`;
}

/** Server Action voor de UI: geeft een voorstel-ID terug voor een gekozen categorie. */
export async function voorstelMateriaalId(categoryId: string): Promise<string> {
  await requireUser();
  return nextMaterialId(categoryId);
}

/**
 * Bepaalt waar een gescande QR-code (bevat alleen het Materiaal-ID) naartoe moet
 * leiden: naar het bestaande materiaalkaartje, of naar "nieuw materiaal" met het
 * gescande ID alvast ingevuld als het nog niet bestaat.
 */
export async function resolveScannedId(rawId: string): Promise<string> {
  await requireUser();
  const id = rawId.trim().toUpperCase();
  if (!id) return "/scan";

  const bestaat = await prisma.material.findUnique({ where: { id }, select: { id: true } });
  if (bestaat) return `/materiaal/${encodeURIComponent(id)}`;
  return `/materiaal/nieuw?id=${encodeURIComponent(id)}`;
}

const materiaalSchema = z.object({
  id: z.string().trim().min(1).max(40).toUpperCase(),
  categoryId: z.string().min(1),
  merk: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  maat: z.string().trim().max(30).optional(),
  aanschafjaar: z.coerce.number().int().min(1990).max(2100).optional(),
  opmerkingen: z.string().trim().max(1000).optional(),
});

export async function createMaterial(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();

  const parsed = materiaalSchema.safeParse({
    id: formData.get("id"),
    categoryId: formData.get("categoryId"),
    merk: formData.get("merk"),
    model: formData.get("model"),
    maat: formData.get("maat") || undefined,
    aanschafjaar: formData.get("aanschafjaar") || undefined,
    opmerkingen: formData.get("opmerkingen") || undefined,
  });

  if (!parsed.success) {
    return { error: "Controleer de ingevulde velden." };
  }

  const bestaat = await prisma.material.findUnique({
    where: { id: parsed.data.id },
  });
  if (bestaat) {
    return { error: `Materiaal-ID "${parsed.data.id}" bestaat al.` };
  }

  await prisma.material.create({
    data: {
      id: parsed.data.id,
      categoryId: parsed.data.categoryId,
      merk: parsed.data.merk,
      model: parsed.data.model,
      maat: parsed.data.maat || null,
      aanschafjaar: parsed.data.aanschafjaar ?? null,
      opmerkingen: parsed.data.opmerkingen || null,
    },
  });

  revalidatePath("/materiaal");
  redirect(`/materiaal/${encodeURIComponent(parsed.data.id)}`);
}

const bewerkSchema = z.object({
  merk: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  maat: z.string().trim().max(30).optional(),
  aanschafjaar: z.coerce.number().int().min(1990).max(2100).optional(),
  opmerkingen: z.string().trim().max(1000).optional(),
  status: z.enum(["IN_GEBRUIK", "IN_REPARATIE", "BUITEN_GEBRUIK"]),
});

export async function updateMaterial(
  materialId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const parsed = bewerkSchema.safeParse({
    merk: formData.get("merk"),
    model: formData.get("model"),
    maat: formData.get("maat") || undefined,
    aanschafjaar: formData.get("aanschafjaar") || undefined,
    opmerkingen: formData.get("opmerkingen") || undefined,
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: "Controleer de ingevulde velden." };
  }

  const huidig = await prisma.material.findUnique({ where: { id: materialId } });
  if (!huidig) return { error: "Materiaal niet gevonden." };

  const statusWordtAfgekeurd =
    parsed.data.status === "BUITEN_GEBRUIK" && huidig.status !== "BUITEN_GEBRUIK";
  if (statusWordtAfgekeurd && !canSetOutOfService(user.role)) {
    return { error: "Alleen duty managers mogen materiaal afkeuren." };
  }

  await prisma.material.update({
    where: { id: materialId },
    data: {
      merk: parsed.data.merk,
      model: parsed.data.model,
      maat: parsed.data.maat || null,
      aanschafjaar: parsed.data.aanschafjaar ?? null,
      opmerkingen: parsed.data.opmerkingen || null,
      status: parsed.data.status as MaterialStatus,
    },
  });

  revalidatePath("/materiaal");
  revalidatePath(`/materiaal/${encodeURIComponent(materialId)}`);
  revalidatePath("/overzicht");
  return undefined;
}

export async function deleteMaterial(materialId: string): Promise<void> {
  const user = await requireDutyManager();
  if (!canDeleteMaterial(user.role)) throw new ActionError("Geen rechten.");

  await prisma.material.delete({ where: { id: materialId } });

  revalidatePath("/materiaal");
  redirect("/materiaal");
}

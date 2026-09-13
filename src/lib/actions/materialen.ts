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
 * leiden: naar het bestaande materiaalkaartje (in het onderdeel waar dat
 * materiaal daadwerkelijk bij hoort — ook als je in een ander onderdeel aan
 * het scannen was), of naar "nieuw materiaal" in het huidige onderdeel met
 * het gescande ID alvast ingevuld als het nog niet bestaat.
 */
/**
 * Zoekt een gescand of handmatig ingevoerd Materiaal-ID op. Navigeert altijd
 * naar het ECHTE onderdeel van het materiaal (ook als er in een ander
 * onderdeel werd gescand). Een onbekend ID levert geen "nieuw materiaal
 * aanmaken"-kortweg meer op (zoals voorheen) — de scanpagina toont in dat
 * geval een foutmelding; materiaal toevoegen gaat via de materiaallijst.
 */
export async function resolveScannedId(
  _huidigeDepartmentId: string,
  rawId: string
): Promise<string | null> {
  await requireUser();
  const id = rawId.trim().toUpperCase();
  if (!id) return null;

  const bestaat = await prisma.material.findUnique({
    where: { id },
    select: { category: { select: { departmentId: true } } },
  });
  if (!bestaat) return null;
  return `/onderdeel/${bestaat.category.departmentId}/materiaal?id=${encodeURIComponent(id)}`;
}

const materiaalSchema = z.object({
  id: z.string().trim().min(1).max(40).toUpperCase(),
  categoryId: z.string().min(1),
  merk: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  maat: z.string().trim().max(30).optional(),
  aanschafjaar: z.coerce.number().int().min(1990).max(2100).optional(),
  opmerkingen: z.string().trim().max(1000).optional(),
  locatie: z.string().trim().max(100).optional(),
  inGebruikSinds: z.coerce.date().optional(),
  extraVeldWaarde: z.string().trim().max(50).optional(),
});

export async function createMaterial(
  departmentId: string,
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
    locatie: formData.get("locatie") || undefined,
    inGebruikSinds: formData.get("inGebruikSinds") || undefined,
    extraVeldWaarde: formData.get("extraVeldWaarde") || undefined,
  });

  if (!parsed.success) {
    return { error: "Controleer de ingevulde velden." };
  }

  const [bestaat, category] = await Promise.all([
    prisma.material.findUnique({ where: { id: parsed.data.id } }),
    prisma.category.findUnique({ where: { id: parsed.data.categoryId } }),
  ]);
  if (bestaat) {
    return { error: `Materiaal-ID "${parsed.data.id}" bestaat al.` };
  }
  if (!category || category.departmentId !== departmentId) {
    return { error: "Onbekende categorie voor dit onderdeel." };
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
      locatie: parsed.data.locatie || null,
      inGebruikSinds: parsed.data.inGebruikSinds ?? null,
      extraVeldWaarde: parsed.data.extraVeldWaarde || null,
    },
  });

  revalidatePath(`/onderdeel/${departmentId}/materiaal`);
  redirect(`/onderdeel/${departmentId}/materiaal?id=${encodeURIComponent(parsed.data.id)}`);
}

const bewerkSchema = z.object({
  merk: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  maat: z.string().trim().max(30).optional(),
  aanschafjaar: z.coerce.number().int().min(1990).max(2100).optional(),
  opmerkingen: z.string().trim().max(1000).optional(),
  locatie: z.string().trim().max(100).optional(),
  inGebruikSinds: z.coerce.date().optional(),
  extraVeldWaarde: z.string().trim().max(50).optional(),
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
    locatie: formData.get("locatie") || undefined,
    inGebruikSinds: formData.get("inGebruikSinds") || undefined,
    extraVeldWaarde: formData.get("extraVeldWaarde") || undefined,
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: "Controleer de ingevulde velden." };
  }

  const huidig = await prisma.material.findUnique({
    where: { id: materialId },
    include: { category: { select: { departmentId: true } } },
  });
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
      locatie: parsed.data.locatie || null,
      inGebruikSinds: parsed.data.inGebruikSinds ?? null,
      extraVeldWaarde: parsed.data.extraVeldWaarde || null,
      status: parsed.data.status as MaterialStatus,
    },
  });

  const departmentId = huidig.category.departmentId;
  revalidatePath(`/onderdeel/${departmentId}/materiaal`);
  revalidatePath(`/onderdeel/${departmentId}/overzicht`);
  return undefined;
}

export async function deleteMaterial(materialId: string): Promise<void> {
  const user = await requireDutyManager();
  if (!canDeleteMaterial(user.role)) throw new ActionError("Geen rechten.");

  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: { category: { select: { departmentId: true } } },
  });
  if (!material) return;

  await prisma.material.delete({ where: { id: materialId } });

  const departmentId = material.category.departmentId;
  revalidatePath(`/onderdeel/${departmentId}/materiaal`);
  redirect(`/onderdeel/${departmentId}/materiaal`);
}

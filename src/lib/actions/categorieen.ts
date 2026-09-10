"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireDutyManager } from "@/lib/actions/guard";

export type FormState = { error?: string } | undefined;

const categorySchema = z.object({
  naam: z.string().trim().min(1).max(60),
  prefix: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .regex(/^[A-Za-z0-9]+$/, "Alleen letters en cijfers")
    .transform((v) => v.toUpperCase()),
});

export async function createCategory(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireDutyManager();

  const parsed = categorySchema.safeParse({
    naam: formData.get("naam"),
    prefix: formData.get("prefix"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };
  }

  const bestaat = await prisma.category.findFirst({
    where: { OR: [{ naam: parsed.data.naam }, { prefix: parsed.data.prefix }] },
  });
  if (bestaat) {
    return { error: "Er bestaat al een categorie met deze naam of prefix." };
  }

  await prisma.category.create({
    data: { naam: parsed.data.naam, prefix: parsed.data.prefix, acties: [] },
  });

  revalidatePath("/beheer");
  return undefined;
}

export async function addActie(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireDutyManager();

  const categoryId = String(formData.get("categoryId") ?? "");
  const actie = String(formData.get("actie") ?? "").trim();
  if (!categoryId || !actie) return { error: "Vul een actienaam in." };

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return { error: "Categorie niet gevonden." };
  if (category.acties.includes(actie)) return { error: "Deze actie bestaat al." };

  await prisma.category.update({
    where: { id: categoryId },
    data: { acties: [...category.acties, actie] },
  });

  revalidatePath("/beheer");
  return undefined;
}

export async function removeActie(categoryId: string, actie: string): Promise<void> {
  await requireDutyManager();

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return;

  await prisma.category.update({
    where: { id: categoryId },
    data: { acties: category.acties.filter((a) => a !== actie) },
  });

  revalidatePath("/beheer");
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireDutyManager } from "@/lib/actions/guard";

export type FormState = { error?: string } | undefined;

const categorySchema = z.object({
  departmentId: z.string().min(1),
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
    departmentId: formData.get("departmentId"),
    naam: formData.get("naam"),
    prefix: formData.get("prefix"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };
  }

  const [department, bestaat] = await Promise.all([
    prisma.department.findUnique({ where: { id: parsed.data.departmentId } }),
    prisma.category.findFirst({
      where: { OR: [{ naam: parsed.data.naam }, { prefix: parsed.data.prefix }] },
    }),
  ]);
  if (!department) return { error: "Onderdeel niet gevonden." };
  if (bestaat) {
    return { error: "Er bestaat al een categorie met deze naam of prefix." };
  }

  await prisma.category.create({
    data: {
      naam: parsed.data.naam,
      prefix: parsed.data.prefix,
      acties: [],
      departmentId: parsed.data.departmentId,
    },
  });

  revalidatePath("/beheer");
  return undefined;
}

const departmentSchema = z.object({
  naam: z.string().trim().min(1).max(60),
});

export async function createDepartment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireDutyManager();

  const parsed = departmentSchema.safeParse({ naam: formData.get("naam") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Vul een naam in." };
  }

  const bestaat = await prisma.department.findUnique({ where: { naam: parsed.data.naam } });
  if (bestaat) return { error: "Er bestaat al een onderdeel met deze naam." };

  await prisma.department.create({ data: { naam: parsed.data.naam } });

  revalidatePath("/beheer");
  revalidatePath("/onderdeel");
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

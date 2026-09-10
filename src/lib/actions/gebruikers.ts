"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireDutyManager } from "@/lib/actions/guard";

export type FormState = { error?: string } | undefined;

const userSchema = z.object({
  naam: z.string().trim().min(1).max(100),
  gebruikersnaam: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9._-]+$/i, "Alleen letters, cijfers, punt, - en _")
    .transform((v) => v.toLowerCase()),
  wachtwoord: z.string().min(8, "Minimaal 8 tekens"),
  role: z.enum(["INSTRUCTEUR", "DUTY_MANAGER"]),
});

export async function createUser(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireDutyManager();

  const parsed = userSchema.safeParse({
    naam: formData.get("naam"),
    gebruikersnaam: formData.get("gebruikersnaam"),
    wachtwoord: formData.get("wachtwoord"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };
  }

  const bestaat = await prisma.user.findUnique({
    where: { gebruikersnaam: parsed.data.gebruikersnaam },
  });
  if (bestaat) return { error: "Deze gebruikersnaam bestaat al." };

  const wachtwoordHash = await bcrypt.hash(parsed.data.wachtwoord, 12);
  await prisma.user.create({
    data: {
      naam: parsed.data.naam,
      gebruikersnaam: parsed.data.gebruikersnaam,
      wachtwoordHash,
      role: parsed.data.role,
    },
  });

  revalidatePath("/beheer");
  return undefined;
}

export async function setGebruikerActief(userId: string, actief: boolean): Promise<void> {
  const beheerder = await requireDutyManager();
  if (beheerder.id === userId && !actief) {
    throw new Error("Je kunt je eigen account niet deactiveren.");
  }

  await prisma.user.update({ where: { id: userId }, data: { actief } });
  revalidatePath("/beheer");
}

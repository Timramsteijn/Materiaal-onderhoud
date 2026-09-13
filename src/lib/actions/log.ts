"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/actions/guard";
import { canSetOutOfService } from "@/lib/permissions";
import type { MaterialStatus } from "@prisma/client";

export type FormState = { error?: string; success?: boolean; loggedAtIso?: string } | undefined;

const logSchema = z.object({
  materialId: z.string().min(1),
  actie: z.string().trim().min(1).max(200),
  opmerkingen: z.string().trim().max(1000).optional(),
  nieuweStatus: z.enum(["IN_GEBRUIK", "IN_REPARATIE", "BUITEN_GEBRUIK"]).optional(),
});

export async function createLogEntry(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const parsed = logSchema.safeParse({
    materialId: formData.get("materialId"),
    actie: formData.get("actie"),
    opmerkingen: formData.get("opmerkingen") || undefined,
    nieuweStatus: formData.get("nieuweStatus") || undefined,
  });

  if (!parsed.success) {
    return { error: "Controleer de ingevulde velden." };
  }

  const material = await prisma.material.findUnique({
    where: { id: parsed.data.materialId },
    include: { category: true },
  });
  if (!material) return { error: "Materiaal niet gevonden." };

  if (!material.category.acties.includes(parsed.data.actie)) {
    return { error: "Onbekende onderhoudsactie voor deze categorie." };
  }

  const nieuweStatus = parsed.data.nieuweStatus;
  const statusWordtAfgekeurd =
    nieuweStatus === "BUITEN_GEBRUIK" && material.status !== "BUITEN_GEBRUIK";
  if (statusWordtAfgekeurd && !canSetOutOfService(user.role)) {
    return { error: "Alleen duty managers mogen materiaal afkeuren." };
  }

  await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: {
        materialId: parsed.data.materialId,
        actie: parsed.data.actie,
        opmerkingen: parsed.data.opmerkingen || null,
        nieuweStatus: (nieuweStatus as MaterialStatus | undefined) ?? null,
        uitgevoerdDoorId: user.id,
      },
    }),
    ...(nieuweStatus && nieuweStatus !== material.status
      ? [
          prisma.material.update({
            where: { id: material.id },
            data: { status: nieuweStatus as MaterialStatus },
          }),
        ]
      : []),
  ]);

  const base = `/onderdeel/${material.category.departmentId}`;
  revalidatePath(`${base}/log`);
  revalidatePath(`${base}/overzicht`);
  revalidatePath(`${base}/materiaal`);
  return { success: true, loggedAtIso: new Date().toISOString() };
}

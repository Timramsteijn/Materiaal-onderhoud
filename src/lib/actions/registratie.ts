"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMedewerker, requireBeheerder } from "@/lib/actions/guard";
import type { Status } from "@prisma/client";

export type RegistratieState =
  | { fout?: string; opgeslagen?: boolean; afkeuringAangevraagd?: boolean }
  | undefined;

const schema = z.object({
  materiaalDbId: z.string().min(1),
  actieId: z.string().min(1),
  opmerking: z.string().trim().max(2000).optional(),
  nieuweStatus: z.enum(["IN_GEBRUIK", "IN_REPARATIE", "BUITEN_GEBRUIK"]).optional(),
  /** Idempotentiesleutel; laat de offline wachtrij veilig opnieuw versturen. */
  clientId: z.string().min(1).max(100),
});

/**
 * Registreert onderhoud. Kiest de medewerker de afkeuractie, dan wordt dit een
 * aanvraag: het materiaal gaat naar "Ter goedkeuring" en blijft uit de verhuur
 * tot een beheerder de afkeuring bevestigt.
 */
export async function registreerOnderhoud(
  _prev: RegistratieState,
  formData: FormData
): Promise<RegistratieState> {
  const medewerker = await requireMedewerker();

  const parsed = schema.safeParse({
    materiaalDbId: formData.get("materiaalDbId"),
    actieId: formData.get("actieId"),
    opmerking: formData.get("opmerking") || undefined,
    nieuweStatus: formData.get("nieuweStatus") || undefined,
    clientId: formData.get("clientId"),
  });
  if (!parsed.success) return { fout: "Controleer de ingevulde velden." };

  // Idempotent: dezelfde clientId levert nooit een tweede logregel op.
  const bestaand = await prisma.logRegel.findUnique({
    where: { clientId: parsed.data.clientId },
    select: { soort: true },
  });
  if (bestaand) {
    return {
      opgeslagen: true,
      afkeuringAangevraagd: bestaand.soort === "AFKEURING_AANGEVRAAGD",
    };
  }

  const materiaal = await prisma.materiaal.findUnique({
    where: { id: parsed.data.materiaalDbId },
    include: { onderdeel: { select: { slug: true } } },
  });
  if (!materiaal) return { fout: "Materiaal niet gevonden." };

  const actie = await prisma.onderhoudsActie.findFirst({
    where: { id: parsed.data.actieId, categorieId: materiaal.categorieId, archivedAt: null },
  });
  if (!actie) return { fout: "Onbekende onderhoudsactie voor deze categorie." };

  const nu = new Date();
  const isAfkeuring = actie.isAfkeuren;

  // Bij een afkeuraanvraag bepaalt de flow de status, niet de keuze in het formulier.
  const nieuweStatus: Status | null = isAfkeuring
    ? "TER_GOEDKEURING"
    : ((parsed.data.nieuweStatus as Status | undefined) ?? null);

  await prisma.$transaction([
    prisma.logRegel.create({
      data: {
        materiaalDbId: materiaal.id,
        actieNaam: actie.naam,
        actieId: actie.id,
        opmerking: parsed.data.opmerking ?? "",
        statusNa: nieuweStatus,
        medewerkerId: medewerker.id,
        medewerkerNaam: medewerker.naam,
        tijdstip: nu,
        soort: isAfkeuring ? "AFKEURING_AANGEVRAAGD" : "REGISTRATIE",
        clientId: parsed.data.clientId,
      },
    }),
    prisma.materiaal.update({
      where: { id: materiaal.id },
      data: {
        laatsteOnderhoud: nu,
        aantalBeurten: { increment: 1 },
        ...(isAfkeuring
          ? {
              status: "TER_GOEDKEURING",
              // Onthouden waar we naar terugdraaien als de aanvraag wordt afgewezen.
              statusVoorKeuring:
                materiaal.status === "TER_GOEDKEURING" ? materiaal.statusVoorKeuring : materiaal.status,
            }
          : nieuweStatus
            ? { status: nieuweStatus }
            : {}),
      },
    }),
  ]);

  revalidatePathsVoor(materiaal.onderdeel.slug, materiaal.materiaalId);
  return { opgeslagen: true, afkeuringAangevraagd: isAfkeuring };
}

function revalidatePathsVoor(slug: string, materiaalId: string) {
  revalidatePath(`/${slug}/materiaal`);
  revalidatePath(`/${slug}/materiaal/${encodeURIComponent(materiaalId)}`);
  revalidatePath(`/${slug}/log`);
  revalidatePath(`/${slug}/overzicht`);
  revalidatePath(`/${slug}/beheer`);
}

/** Beheerder bevestigt de afkeuring: het materiaal gaat definitief uit de verhuur. */
export async function keurAfkeuringGoed(materiaalDbId: string): Promise<void> {
  const beheerder = await requireBeheerder();

  const materiaal = await prisma.materiaal.findUnique({
    where: { id: materiaalDbId },
    include: { onderdeel: { select: { slug: true } } },
  });
  if (!materiaal || materiaal.status !== "TER_GOEDKEURING") return;

  await prisma.$transaction([
    prisma.materiaal.update({
      where: { id: materiaal.id },
      data: { status: "BUITEN_GEBRUIK", statusVoorKeuring: null },
    }),
    prisma.logRegel.create({
      data: {
        materiaalDbId: materiaal.id,
        actieNaam: "Afkeuring goedgekeurd",
        opmerking: "",
        statusNa: "BUITEN_GEBRUIK",
        medewerkerId: beheerder.id,
        medewerkerNaam: beheerder.naam,
        soort: "AFKEURING_GOEDGEKEURD",
        clientId: `keuring:goed:${materiaal.id}:${Date.now()}`,
      },
    }),
    prisma.beheerLog.create({
      data: {
        medewerkerId: beheerder.id,
        wat: "Afkeuring goedgekeurd",
        detail: { materiaalId: materiaal.materiaalId },
      },
    }),
  ]);

  revalidatePathsVoor(materiaal.onderdeel.slug, materiaal.materiaalId);
}

/** Beheerder wijst de afkeuring af: het materiaal keert terug naar de vorige status. */
export async function wijsAfkeuringAf(materiaalDbId: string): Promise<void> {
  const beheerder = await requireBeheerder();

  const materiaal = await prisma.materiaal.findUnique({
    where: { id: materiaalDbId },
    include: { onderdeel: { select: { slug: true } } },
  });
  if (!materiaal || materiaal.status !== "TER_GOEDKEURING") return;

  const terug: Status = materiaal.statusVoorKeuring ?? "IN_GEBRUIK";

  await prisma.$transaction([
    prisma.materiaal.update({
      where: { id: materiaal.id },
      data: { status: terug, statusVoorKeuring: null },
    }),
    prisma.logRegel.create({
      data: {
        materiaalDbId: materiaal.id,
        actieNaam: "Afkeuring afgewezen",
        opmerking: "",
        statusNa: terug,
        medewerkerId: beheerder.id,
        medewerkerNaam: beheerder.naam,
        soort: "AFKEURING_AFGEWEZEN",
        clientId: `keuring:afgewezen:${materiaal.id}:${Date.now()}`,
      },
    }),
    prisma.beheerLog.create({
      data: {
        medewerkerId: beheerder.id,
        wat: "Afkeuring afgewezen",
        detail: { materiaalId: materiaal.materiaalId },
      },
    }),
  ]);

  revalidatePathsVoor(materiaal.onderdeel.slug, materiaal.materiaalId);
}

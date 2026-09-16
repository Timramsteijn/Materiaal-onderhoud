import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Zoekt het onderdeel bij een slug. Gecached per request, zodat layout en
 * pagina's hem samen kunnen opvragen zonder dubbele query.
 */
export const getOnderdeel = cache(async (slug: string) => {
  const onderdeel = await prisma.onderdeel.findUnique({ where: { slug } });
  if (!onderdeel) notFound();
  return onderdeel;
});

/** Actieve categorieën van een onderdeel, in weergavevolgorde. */
export const getCategorieen = cache(async (onderdeelId: string) => {
  return prisma.categorie.findMany({
    where: { onderdeelId, archivedAt: null },
    orderBy: { sortering: "asc" },
  });
});

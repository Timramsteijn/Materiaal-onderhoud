import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "./context";
import { categorieen, onderdelen, onderhoudsacties, velddefinities } from "../db/schema";

/** Zoekt het onderdeel bij een slug; `undefined` betekent 404. */
export async function getOnderdeel(slug: string) {
  return db().query.onderdelen.findFirst({ where: eq(onderdelen.slug, slug) });
}

export async function getOnderdelen() {
  return db().query.onderdelen.findMany({ orderBy: asc(onderdelen.sortering) });
}

/** Actieve categorieën van een onderdeel, in weergavevolgorde. */
export async function getCategorieen(onderdeelId: string) {
  return db()
    .select()
    .from(categorieen)
    .where(and(eq(categorieen.onderdeelId, onderdeelId), isNull(categorieen.archivedAt)))
    .orderBy(asc(categorieen.sortering));
}

export async function getActies(categorieId: string) {
  return db()
    .select()
    .from(onderhoudsacties)
    .where(
      and(eq(onderhoudsacties.categorieId, categorieId), isNull(onderhoudsacties.archivedAt))
    )
    .orderBy(asc(onderhoudsacties.sortering));
}

export async function getVelden(categorieId: string) {
  return db()
    .select()
    .from(velddefinities)
    .where(and(eq(velddefinities.categorieId, categorieId), isNull(velddefinities.archivedAt)))
    .orderBy(asc(velddefinities.sortering));
}

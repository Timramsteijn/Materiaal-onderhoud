"use client";

import { useActionState, useTransition } from "react";
import type { Category } from "@prisma/client";
import { addActie, createCategory, removeActie, type FormState } from "@/lib/actions/categorieen";

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-[14px] text-ink";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createCategory,
    undefined
  );

  return (
    <div className="space-y-3">
      {categories.map((c) => (
        <CategoryCard key={c.id} category={c} />
      ))}

      <details className="rounded-2xl bg-panel p-4 shadow-sm">
        <summary className="label-font cursor-pointer text-[14px] text-ink">
          + Nieuwe categorie
        </summary>
        <form action={action} className="mt-3 grid grid-cols-[1fr_100px] gap-2">
          <input name="naam" placeholder="Naam (bv. Klimmateriaal)" required className={inputClass} />
          <input name="prefix" placeholder="Prefix (bv. KLIM)" required className={inputClass} />
          <button
            type="submit"
            disabled={pending}
            className="col-span-2 mt-1 rounded-lg bg-amber px-4 py-2 text-[13px] font-semibold text-graphite disabled:opacity-60"
          >
            {pending ? "Bezig..." : "Categorie toevoegen"}
          </button>
        </form>
        {state?.error && <p className="mt-2 text-[12.5px] text-danger">{state.error}</p>}
      </details>
    </div>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addActie, undefined);
  const [removing, startRemoving] = useTransition();

  return (
    <div className="rounded-2xl bg-panel p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="label-font text-[15px] text-ink">{category.naam}</p>
        <span className="rounded bg-bg px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-soft">
          {category.prefix}
        </span>
      </div>

      <ul className="mt-2 space-y-1">
        {category.acties.map((actie) => (
          <li
            key={actie}
            className="flex items-center justify-between rounded-lg bg-bg px-2.5 py-1.5 text-[12.5px] text-ink"
          >
            {actie}
            <button
              type="button"
              disabled={removing}
              onClick={() => startRemoving(() => removeActie(category.id, actie))}
              className="text-danger"
              aria-label={`Verwijder actie ${actie}`}
            >
              ✕
            </button>
          </li>
        ))}
        {category.acties.length === 0 && (
          <li className="text-[12.5px] text-ink-soft">Nog geen onderhoudsacties.</li>
        )}
      </ul>

      <form action={action} className="mt-2 flex gap-2">
        <input type="hidden" name="categoryId" value={category.id} />
        <input name="actie" placeholder="Nieuwe onderhoudsactie..." className={inputClass} />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-ice px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          +
        </button>
      </form>
      {state?.error && <p className="mt-1 text-[12px] text-danger">{state.error}</p>}
    </div>
  );
}

"use client";

import { useActionState, useTransition } from "react";
import type { Category, Department } from "@prisma/client";
import {
  addActie,
  createCategory,
  createDepartment,
  removeActie,
  type FormState,
} from "@/lib/actions/categorieen";

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-[14px] text-ink";

type DepartmentMetCategorieen = Department & { categories: Category[] };

export function CategoryManager({
  departments,
}: {
  departments: DepartmentMetCategorieen[];
}) {
  const [catState, catAction, catPending] = useActionState<FormState, FormData>(
    createCategory,
    undefined
  );
  const [deptState, deptAction, deptPending] = useActionState<FormState, FormData>(
    createDepartment,
    undefined
  );

  return (
    <div className="space-y-3">
      {departments.map((dept) => (
        <div key={dept.id} className="rounded-2xl bg-panel p-4 shadow-sm">
          <p className="label-font mb-2 text-[15px] text-ink">{dept.naam}</p>
          {dept.categories.length === 0 ? (
            <p className="text-[12.5px] text-ink-soft">Nog geen categorieen in dit onderdeel.</p>
          ) : (
            <div className="space-y-3">
              {dept.categories.map((c) => (
                <CategoryCard key={c.id} category={c} />
              ))}
            </div>
          )}
        </div>
      ))}

      <details className="rounded-2xl bg-panel p-4 shadow-sm">
        <summary className="label-font cursor-pointer text-[14px] text-ink">
          + Nieuwe categorie
        </summary>
        <form action={catAction} className="mt-3 space-y-2">
          <select name="departmentId" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Kies een onderdeel
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.naam}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-[1fr_100px] gap-2">
            <input name="naam" placeholder="Naam (bv. Klimtouw)" required className={inputClass} />
            <input name="prefix" placeholder="Prefix (bv. TOUW)" required className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={catPending}
            className="w-full rounded-lg bg-amber px-4 py-2 text-[13px] font-semibold text-graphite disabled:opacity-60"
          >
            {catPending ? "Bezig..." : "Categorie toevoegen"}
          </button>
        </form>
        {catState?.error && <p className="mt-2 text-[12.5px] text-danger">{catState.error}</p>}
      </details>

      <details className="rounded-2xl bg-panel p-4 shadow-sm">
        <summary className="label-font cursor-pointer text-[14px] text-ink">
          + Nieuw onderdeel
        </summary>
        <form action={deptAction} className="mt-3 flex gap-2">
          <input
            name="naam"
            placeholder="Naam (bv. Boogschieten)"
            required
            className={inputClass}
          />
          <button
            type="submit"
            disabled={deptPending}
            className="shrink-0 rounded-lg bg-amber px-4 py-2 text-[13px] font-semibold text-graphite disabled:opacity-60"
          >
            {deptPending ? "Bezig..." : "Toevoegen"}
          </button>
        </form>
        {deptState?.error && <p className="mt-2 text-[12.5px] text-danger">{deptState.error}</p>}
      </details>
    </div>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addActie, undefined);
  const [removing, startRemoving] = useTransition();

  return (
    <div className="rounded-xl bg-bg p-3">
      <div className="flex items-center justify-between">
        <p className="label-font text-[14px] text-ink">{category.naam}</p>
        <span className="rounded bg-panel px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-soft">
          {category.prefix}
        </span>
      </div>

      <ul className="mt-2 space-y-1">
        {category.acties.map((actie) => (
          <li
            key={actie}
            className="flex items-center justify-between rounded-lg bg-panel px-2.5 py-1.5 text-[12.5px] text-ink"
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

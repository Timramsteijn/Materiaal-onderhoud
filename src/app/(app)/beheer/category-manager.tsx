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
import { X, Plus } from "@/components/icons";

const inputClass =
  "w-full rounded-lg border border-border-light bg-input-fill px-3 py-2 text-[14px] text-ink";

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
        <div key={dept.id} className="rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="font-display mb-3 text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-ink">
            Onderdeel · {dept.naam}
          </p>
          {dept.categories.length === 0 ? (
            <p className="text-[12.5px] text-text-muted">Nog geen categorieen in dit onderdeel.</p>
          ) : (
            <div className="space-y-3">
              {dept.categories.map((c) => (
                <CategoryCard key={c.id} category={c} />
              ))}
            </div>
          )}
        </div>
      ))}

      <details className="rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)]">
        <summary className="font-display cursor-pointer text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-ink">
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
          <input
            name="extraVeldLabel"
            placeholder="Extra specificatieveld (optioneel, bv. DIN)"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={catPending}
            className="w-full rounded-lg bg-orange px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-orange-hover disabled:opacity-60"
          >
            {catPending ? "Bezig..." : "Categorie toevoegen"}
          </button>
        </form>
        {catState?.error && <p className="mt-2 text-[12.5px] text-red">{catState.error}</p>}
      </details>

      <details className="rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)]">
        <summary className="font-display cursor-pointer text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-ink">
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
            className="shrink-0 rounded-lg bg-orange px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-orange-hover disabled:opacity-60"
          >
            {deptPending ? "Bezig..." : "Toevoegen"}
          </button>
        </form>
        {deptState?.error && <p className="mt-2 text-[12.5px] text-red">{deptState.error}</p>}
      </details>
    </div>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addActie, undefined);
  const [removing, startRemoving] = useTransition();

  return (
    <div className="rounded-lg bg-bg p-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-[14px] font-extrabold italic text-ink">
          {category.naam}
          {category.extraVeldLabel ? (
            <span className="ml-1.5 text-[10.5px] font-normal not-italic text-text-muted">
              · {category.extraVeldLabel}
            </span>
          ) : null}
        </p>
        <span className="rounded-full bg-card px-2 py-0.5 text-[10.5px] font-semibold text-text-muted">
          {category.prefix}
        </span>
      </div>

      <p className="mb-1.5 mt-2.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-text-dark-secondary">
        Onderhoudsacties
      </p>
      <div className="flex flex-wrap gap-2">
        {category.acties.map((actie) => (
          <span
            key={actie}
            className="flex items-center gap-1.5 rounded-[9px] border border-border-light bg-input-fill px-2.5 py-1.5 text-[12px] text-ink"
          >
            {actie}
            <button
              type="button"
              disabled={removing}
              onClick={() => startRemoving(() => removeActie(category.id, actie))}
              className="text-red disabled:opacity-40"
              aria-label={`Verwijder actie ${actie}`}
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        {category.acties.length === 0 && (
          <span className="text-[12.5px] text-text-muted">Nog geen onderhoudsacties.</span>
        )}
      </div>

      <form action={action} className="mt-2 flex gap-2">
        <input type="hidden" name="categoryId" value={category.id} />
        <input
          name="actie"
          placeholder="Nieuwe onderhoudsactie..."
          className={`${inputClass} py-1.5 text-[12.5px]`}
        />
        <button
          type="submit"
          disabled={pending}
          className="flex shrink-0 items-center gap-1 rounded-[9px] border border-dashed border-steel px-2.5 text-[12px] font-semibold text-steel-dark disabled:opacity-60"
        >
          <Plus size={13} strokeWidth={2.5} />
          toevoegen
        </button>
      </form>
      {state?.error && <p className="mt-1 text-[12px] text-red">{state.error}</p>}
    </div>
  );
}

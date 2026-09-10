"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import type { Category } from "@prisma/client";
import { createMaterial, voorstelMateriaalId, type FormState } from "@/lib/actions/materialen";

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[15px] text-ink";
const labelClass = "mb-1.5 mt-3 block text-[12.5px] font-semibold text-ink-soft first:mt-0";

export function NewMaterialForm({
  departmentId,
  categories,
  initialCategoryId,
  initialId,
}: {
  departmentId: string;
  categories: Category[];
  initialCategoryId?: string;
  initialId?: string;
}) {
  const createMaterialInDepartment = createMaterial.bind(null, departmentId);
  const [state, action, pending] = useActionState<FormState, FormData>(
    createMaterialInDepartment,
    undefined
  );
  const [categoryId, setCategoryId] = useState(initialCategoryId || categories[0]?.id || "");
  const [materialId, setMaterialId] = useState(initialId || "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!materialId && categoryId) {
      startTransition(async () => {
        const voorstel = await voorstelMateriaalId(categoryId);
        setMaterialId(voorstel);
      });
    }
    // Alleen bij het eerste renderen een voorstel ophalen als het veld nog leeg is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onCategoryChange(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    startTransition(async () => {
      const voorstel = await voorstelMateriaalId(nextCategoryId);
      setMaterialId(voorstel);
    });
  }

  return (
    <form action={action} className="rounded-2xl bg-panel p-4 shadow-sm">
      <label className={labelClass} htmlFor="categoryId">
        Categorie
      </label>
      <select
        id="categoryId"
        name="categoryId"
        className={inputClass}
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.naam}
          </option>
        ))}
      </select>

      <label className={labelClass} htmlFor="id">
        Materiaal-ID
      </label>
      <input
        id="id"
        name="id"
        required
        value={materialId}
        onChange={(e) => setMaterialId(e.target.value.toUpperCase())}
        className={`${inputClass} uppercase`}
        placeholder="Kies een categorie voor een voorstel"
      />

      <label className={labelClass} htmlFor="merk">
        Merk
      </label>
      <input id="merk" name="merk" required className={inputClass} />

      <label className={labelClass} htmlFor="model">
        Model
      </label>
      <input id="model" name="model" required className={inputClass} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft" htmlFor="maat">
            Maat
          </label>
          <input id="maat" name="maat" className={inputClass} />
        </div>
        <div>
          <label
            className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft"
            htmlFor="aanschafjaar"
          >
            Aanschafjaar
          </label>
          <input
            id="aanschafjaar"
            name="aanschafjaar"
            type="number"
            inputMode="numeric"
            className={inputClass}
          />
        </div>
      </div>

      <label className={labelClass} htmlFor="opmerkingen">
        Opmerkingen
      </label>
      <textarea id="opmerkingen" name="opmerkingen" rows={2} className={inputClass} />

      {state?.error && (
        <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-lg bg-amber px-4 py-3 text-[14.5px] font-semibold text-graphite disabled:opacity-60"
      >
        {pending ? "Opslaan..." : "Materiaal toevoegen"}
      </button>
    </form>
  );
}

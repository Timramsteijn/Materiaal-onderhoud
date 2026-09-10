"use client";

import { useActionState } from "react";
import { updateMaterial, type FormState } from "@/lib/actions/materialen";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/domain";
import type { Material } from "@prisma/client";

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[15px] text-ink";
const labelClass = "mb-1.5 mt-3 block text-[12.5px] font-semibold text-ink-soft first:mt-0";

export function EditMaterialForm({
  material,
  magAfkeuren,
}: {
  material: Material;
  magAfkeuren: boolean;
}) {
  const updateWithId = updateMaterial.bind(null, material.id);
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateWithId,
    undefined
  );

  return (
    <details className="rounded-2xl bg-panel p-4 shadow-sm">
      <summary className="label-font cursor-pointer text-[14px] text-ink">
        Materiaalgegevens bewerken
      </summary>
      <form action={action} className="mt-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="merk">
              Merk
            </label>
            <input id="merk" name="merk" defaultValue={material.merk} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="model">
              Model
            </label>
            <input id="model" name="model" defaultValue={material.model} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="maat">
              Maat
            </label>
            <input id="maat" name="maat" defaultValue={material.maat ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="aanschafjaar">
              Aanschafjaar
            </label>
            <input
              id="aanschafjaar"
              name="aanschafjaar"
              type="number"
              defaultValue={material.aanschafjaar ?? undefined}
              className={inputClass}
            />
          </div>
        </div>

        <label className={labelClass} htmlFor="status">
          Status
        </label>
        <select id="status" name="status" defaultValue={material.status} className={inputClass}>
          {STATUS_ORDER.filter((s) => s !== "BUITEN_GEBRUIK" || magAfkeuren || material.status === s).map(
            (s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            )
          )}
        </select>

        <label className={labelClass} htmlFor="opmerkingen">
          Opmerkingen
        </label>
        <textarea
          id="opmerkingen"
          name="opmerkingen"
          rows={2}
          defaultValue={material.opmerkingen ?? ""}
          className={inputClass}
        />

        {state?.error && (
          <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-[13px] text-danger">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-lg bg-graphite px-4 py-3 text-[14.5px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Opslaan..." : "Wijzigingen opslaan"}
        </button>
      </form>
    </details>
  );
}

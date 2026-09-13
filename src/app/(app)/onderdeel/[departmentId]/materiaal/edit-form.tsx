"use client";

import { useActionState } from "react";
import { updateMaterial, type FormState } from "@/lib/actions/materialen";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/domain";
import type { Material } from "@prisma/client";

type BewerkbaarMateriaal = Pick<
  Material,
  | "id"
  | "merk"
  | "model"
  | "maat"
  | "aanschafjaar"
  | "locatie"
  | "inGebruikSinds"
  | "extraVeldWaarde"
  | "opmerkingen"
  | "status"
>;

const inputClass =
  "w-full rounded-lg border border-border-light bg-input-fill px-3 py-2.5 text-[14px] text-ink";
const labelClass =
  "mb-1.5 mt-3 block text-[11px] font-bold uppercase tracking-[0.08em] text-text-dark-secondary first:mt-0";

function isoDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export function EditMaterialForm({
  material,
  extraVeldLabel,
  magAfkeuren,
}: {
  material: BewerkbaarMateriaal;
  extraVeldLabel: string | null;
  magAfkeuren: boolean;
}) {
  const updateWithId = updateMaterial.bind(null, material.id);
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateWithId,
    undefined
  );

  return (
    <details className="rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)]">
      <summary className="font-display cursor-pointer text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-ink">
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
          <div>
            <label className={labelClass} htmlFor="locatie">
              Locatie
            </label>
            <input
              id="locatie"
              name="locatie"
              defaultValue={material.locatie ?? ""}
              placeholder="bv. Werkplaats · werkbank 2"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="inGebruikSinds">
              In gebruik sinds
            </label>
            <input
              id="inGebruikSinds"
              name="inGebruikSinds"
              type="date"
              defaultValue={isoDateInput(material.inGebruikSinds)}
              className={inputClass}
            />
          </div>
          {extraVeldLabel && (
            <div>
              <label className={labelClass} htmlFor="extraVeldWaarde">
                {extraVeldLabel}
              </label>
              <input
                id="extraVeldWaarde"
                name="extraVeldWaarde"
                defaultValue={material.extraVeldWaarde ?? ""}
                className={inputClass}
              />
            </div>
          )}
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

        {state?.error && <p className="mt-3 text-[12.5px] text-red">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-lg bg-ink px-4 py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-ink-light disabled:opacity-60"
        >
          {pending ? "Opslaan..." : "Wijzigingen opslaan"}
        </button>
      </form>
    </details>
  );
}

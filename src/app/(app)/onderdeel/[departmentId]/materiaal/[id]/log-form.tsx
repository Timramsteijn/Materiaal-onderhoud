"use client";

import { useActionState, useState } from "react";
import { createLogEntry, type FormState } from "@/lib/actions/log";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/domain";
import type { MaterialStatus } from "@prisma/client";

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[15px] text-ink";
const labelClass = "mb-1.5 mt-3 block text-[12.5px] font-semibold text-ink-soft first:mt-0";

export function LogForm({
  materialId,
  acties,
  huidigeStatus,
  magAfkeuren,
}: {
  materialId: string;
  acties: string[];
  huidigeStatus: MaterialStatus;
  magAfkeuren: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createLogEntry,
    undefined
  );
  const [statusWijzigen, setStatusWijzigen] = useState(false);

  return (
    <form action={action} className="rounded-2xl bg-panel p-4 shadow-sm">
      <input type="hidden" name="materialId" value={materialId} />

      <label className={labelClass} htmlFor="actie">
        Onderhoudsactie
      </label>
      <select id="actie" name="actie" required className={inputClass}>
        {acties.map((actie) => (
          <option key={actie} value={actie}>
            {actie}
          </option>
        ))}
      </select>

      <label className={labelClass} htmlFor="opmerkingen">
        Opmerkingen (optioneel)
      </label>
      <textarea id="opmerkingen" name="opmerkingen" rows={2} className={inputClass} />

      <label className="mt-3 flex items-center gap-2 text-[13px] text-ink">
        <input
          type="checkbox"
          checked={statusWijzigen}
          onChange={(e) => setStatusWijzigen(e.target.checked)}
        />
        Status van dit materiaal ook wijzigen
      </label>

      {statusWijzigen && (
        <select name="nieuweStatus" defaultValue={huidigeStatus} className={`${inputClass} mt-2`}>
          {STATUS_ORDER.filter((s) => s !== "BUITEN_GEBRUIK" || magAfkeuren).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      )}

      {state?.error && (
        <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="mt-3 rounded-lg bg-good-bg px-3 py-2 text-[13px] text-good">
          Onderhoud geregistreerd.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-lg bg-ice px-4 py-3 text-[14.5px] font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Bezig..." : "Onderhoud registreren"}
      </button>
    </form>
  );
}

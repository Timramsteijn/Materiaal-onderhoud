"use client";

import { useActionState, useState } from "react";
import { createLogEntry, type FormState } from "@/lib/actions/log";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/domain";
import { Check } from "@/components/icons";
import type { MaterialStatus } from "@prisma/client";

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-2 font-display text-[11.5px] font-bold uppercase italic transition-colors ${
        active
          ? "border-ink bg-ink text-orange"
          : "border-card-border bg-card text-text-medium hover:border-steel"
      }`}
    >
      {label}
    </button>
  );
}

export function LogForm({
  materialId,
  acties,
  magAfkeuren,
  userNaam,
}: {
  materialId: string;
  acties: string[];
  magAfkeuren: boolean;
  userNaam: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createLogEntry,
    undefined
  );
  const [actie, setActie] = useState(
    acties.includes("Reparatie") ? "Reparatie" : (acties[0] ?? "")
  );
  const [nieuweStatus, setNieuweStatus] = useState<MaterialStatus | null>(null);

  const statusOpties = STATUS_ORDER.filter((s) => s !== "BUITEN_GEBRUIK" || magAfkeuren);

  return (
    <form
      action={action}
      className="rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)] desktop:flex-1"
    >
      <h2 className="font-display mb-3 text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-ink">
        Onderhoud registreren
      </h2>

      <input type="hidden" name="materialId" value={materialId} />
      <input type="hidden" name="actie" value={actie} />
      {nieuweStatus && <input type="hidden" name="nieuweStatus" value={nieuweStatus} />}

      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-text-dark-secondary">
        Actie
      </label>
      <div className="flex flex-wrap gap-2">
        {acties.map((a) => (
          <Pill key={a} label={a} active={actie === a} onClick={() => setActie(a)} />
        ))}
      </div>

      <label
        htmlFor="opmerkingen"
        className="mb-1.5 mt-4 block text-[11px] font-bold uppercase tracking-[0.08em] text-text-dark-secondary"
      >
        Opmerking
      </label>
      <textarea
        id="opmerkingen"
        name="opmerkingen"
        rows={3}
        placeholder="Wat heb je gedaan of gezien?"
        className="w-full rounded-lg border border-border-light bg-input-fill px-3 py-2.5 text-[14px] text-ink placeholder:text-text-muted"
      />

      <label className="mb-1.5 mt-4 block text-[11px] font-bold uppercase tracking-[0.08em] text-text-dark-secondary">
        Status wijzigen (optioneel)
      </label>
      <div className="flex flex-wrap gap-2">
        {statusOpties.map((s) => (
          <Pill
            key={s}
            label={STATUS_LABELS[s]}
            active={nieuweStatus === s}
            onClick={() => setNieuweStatus((huidig) => (huidig === s ? null : s))}
          />
        ))}
      </div>

      {state?.error && <p className="mt-3 text-[12.5px] text-red">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-orange text-[14.5px] font-bold uppercase tracking-[0.03em] text-white transition-colors hover:bg-orange-hover disabled:opacity-60 desktop:h-[46px] desktop:w-auto desktop:px-6"
      >
        {state?.success ? (
          <>
            <Check size={18} strokeWidth={2.2} />
            Onderhoud opgeslagen
          </>
        ) : pending ? (
          "Bezig..."
        ) : (
          "Onderhoud opslaan"
        )}
      </button>

      {state?.success && state.loggedAtIso && (
        <p className="mt-2 text-[12px] text-text-muted">
          Gelogd op{" "}
          {new Date(state.loggedAtIso).toLocaleDateString("nl-NL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}{" "}
          om{" "}
          {new Date(state.loggedAtIso).toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          door {userNaam}.
        </p>
      )}
    </form>
  );
}

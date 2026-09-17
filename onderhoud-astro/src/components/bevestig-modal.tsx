import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2 } from "@/components/icons";

/**
 * Bevestiging bij verwijderen/archiveren. Altijd dezelfde opbouw: rode kicker,
 * de vraag als kop, de gevolgen, en het blok dat vertelt dat de wijziging
 * wordt gelogd. Gebruikt voor acties, velden, categorieën en medewerkers.
 */
export function BevestigModal({
  vraag,
  gevolgen,
  medewerkerNaam,
  bezig,
  onBevestig,
  onAnnuleer,
}: {
  vraag: string;
  gevolgen: string;
  medewerkerNaam?: string;
  bezig?: boolean;
  onBevestig: () => void;
  onAnnuleer: () => void;
}) {
  const annuleerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    annuleerRef.current?.focus();
    const opEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAnnuleer();
    };
    document.addEventListener("keydown", opEscape);
    return () => document.removeEventListener("keydown", opEscape);
  }, [onAnnuleer]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(21,33,43,.55)" }}
      onClick={onAnnuleer}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={vraag}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-card bg-creme p-5 shadow-[var(--shadow-hover)]"
      >
        <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-red-text">
          <AlertTriangle size={14} strokeWidth={2.2} />
          Let op
        </p>
        <h2 className="display mt-2 text-[20px] text-ink">{vraag}</h2>
        <p className="mt-2 text-[13.5px] text-text-medium">{gevolgen}</p>

        <p className="mt-3 rounded-input bg-neutral-fill px-3 py-2.5 text-[12.5px] text-text-muted">
          Alleen beheerders kunnen dit.
          {medewerkerNaam ? ` De wijziging wordt gelogd op naam van ${medewerkerNaam}.` : ""}
        </p>

        <div className="mt-4 flex justify-end gap-2.5">
          <button
            ref={annuleerRef}
            type="button"
            onClick={onAnnuleer}
            className="motion min-h-[44px] rounded-full border-[1.5px] border-ink px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-ink hover:bg-neutral-fill"
          >
            Annuleren
          </button>
          <button
            type="button"
            disabled={bezig}
            onClick={onBevestig}
            className="motion flex min-h-[44px] items-center gap-2 rounded-full bg-red-text px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-creme hover:bg-[#8a281e] disabled:opacity-60"
          >
            <Trash2 size={15} strokeWidth={2} />
            {bezig ? "Bezig…" : "Verwijderen"}
          </button>
        </div>
      </div>
    </div>
  );
}

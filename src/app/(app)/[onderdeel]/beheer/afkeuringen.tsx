"use client";

import { useTransition } from "react";
import { keurAfkeuringGoed, wijsAfkeuringAf } from "@/lib/actions/registratie";
import { Check, X } from "@/components/icons";

type Aanvraag = {
  id: string;
  materiaalId: string;
  merkModel: string;
  reden: string;
  aangevraagdDoor: string;
  wanneer: string;
};

/**
 * Bovenaan Beheer: afkeuringen die een medewerker heeft aangevraagd. Alleen
 * een beheerder kan ze bevestigen; goedkeuren zet het materiaal op Buiten
 * gebruik, afwijzen zet het terug op de vorige status.
 */
export function AfkeuringenKaart({ aanvragen }: { aanvragen: Aanvraag[] }) {
  const [bezig, start] = useTransition();

  return (
    <section className="overflow-hidden rounded-card border border-border-light bg-creme shadow-[var(--shadow-card)]">
      <div className="h-[3px] bg-accent" />
      <div className="p-4">
        <div className="flex items-center gap-2">
          <h2 className="font-body text-[12px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
            Afkeuringen ter goedkeuring
          </h2>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-accent-on">
            {aanvragen.length} open
          </span>
        </div>

        <ul className="mt-3 divide-y divide-zand">
          {aanvragen.map((a) => (
            <li key={a.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[14.5px] font-extrabold text-ink">{a.materiaalId}</span>
                <span className="text-[13px] text-text-medium">{a.merkModel}</span>
              </div>
              {a.reden && <p className="mt-1 text-[13px] text-text-medium">&ldquo;{a.reden}&rdquo;</p>}
              <p className="mt-0.5 text-[12px] text-text-muted">
                Aangevraagd door {a.aangevraagdDoor}
                {a.wanneer ? ` · ${a.wanneer}` : ""}
              </p>

              <div className="mt-2.5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={bezig}
                  onClick={() => start(() => keurAfkeuringGoed(a.id))}
                  className="motion flex min-h-[44px] items-center gap-2 rounded-full bg-green-figure px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-creme hover:bg-green-text disabled:opacity-60"
                >
                  <Check size={16} strokeWidth={2.4} />
                  Goedkeuren
                </button>
                <button
                  type="button"
                  disabled={bezig}
                  onClick={() => start(() => wijsAfkeuringAf(a.id))}
                  className="motion flex min-h-[44px] items-center gap-2 rounded-full border-[1.5px] border-red-text px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-red-text hover:bg-red-tint disabled:opacity-60"
                >
                  <X size={16} strokeWidth={2.4} />
                  Afwijzen
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

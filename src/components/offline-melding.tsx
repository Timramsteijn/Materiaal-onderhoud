"use client";

import { useEffect, useSyncExternalStore } from "react";
import { registreerOnderhoud } from "@/lib/actions/registratie";
import { wachtrijStore, ververs, verstuurWachtrij } from "@/lib/offline-queue";
import { WifiOff } from "@/components/icons";

/** Verbindingstoestand als externe store — geen state die in een effect hoeft. */
function abonneerOpVerbinding(melden: () => void) {
  window.addEventListener("online", melden);
  window.addEventListener("offline", melden);
  return () => {
    window.removeEventListener("online", melden);
    window.removeEventListener("offline", melden);
  };
}

/**
 * Toont de verbindingstoestand en wat er nog in de wachtrij staat. De wachtrij
 * loopt automatisch leeg zodra er weer verbinding is; een conflict blijft
 * zichtbaar staan in plaats van stil te verdwijnen.
 */
export function OfflineMelding() {
  const online = useSyncExternalStore(
    abonneerOpVerbinding,
    () => navigator.onLine,
    () => true
  );
  const { regels, mislukt } = useSyncExternalStore(
    wachtrijStore.abonneer,
    wachtrijStore.lees,
    wachtrijStore.leesOpServer
  );

  useEffect(() => {
    // Bij binnenkomst én zodra er weer bereik is: de wachtrij legen.
    if (online) {
      void verstuurWachtrij((formData) => registreerOnderhoud(undefined, formData));
    } else {
      void ververs();
    }
  }, [online]);

  if (online && regels.length === 0) return null;

  return (
    <div className="mb-3">
      {!online && (
        <div className="flex items-start gap-2.5 rounded-card bg-navy px-4 py-3">
          <WifiOff size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-accent" />
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-accent">
              Geen verbinding
            </p>
            <p className="mt-0.5 text-[12.5px] text-text-on-dark">
              Je kunt blijven scannen en registreren. Alles wordt verstuurd zodra de werkplaats
              weer bereik heeft.
            </p>
          </div>
        </div>
      )}

      {regels.length > 0 && (
        <div className="mt-2 rounded-card border border-border-light bg-creme p-4 shadow-[var(--shadow-light)]">
          <div className="flex items-center gap-2">
            <h2 className="font-body text-[12px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
              In wachtrij
            </h2>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-accent-on">
              {regels.length} {regels.length === 1 ? "registratie" : "registraties"}
            </span>
          </div>

          <ul className="mt-2 divide-y divide-zand">
            {regels.map((regel) => (
              <li key={regel.clientId} className="flex items-center justify-between gap-3 py-2">
                <span className="text-[13.5px] font-extrabold text-ink">{regel.materiaalLabel}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-medium">
                  {regel.actieNaam}
                </span>
                <span className="shrink-0 text-[12px] text-text-muted">
                  {new Date(regel.tijdstip).toLocaleTimeString("nl-NL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>

          {mislukt > 0 && (
            <p className="mt-2 text-[12.5px] text-red-text">
              {mislukt} {mislukt === 1 ? "registratie kon" : "registraties konden"} niet worden
              verstuurd — het materiaal is inmiddels gewijzigd. Controleer het kaartje.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

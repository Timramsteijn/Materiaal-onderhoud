"use client";

import { useActionState, useState } from "react";
import { registreerOnderhoud, type RegistratieState } from "@/lib/actions/registratie";
import { STATUS_KEUZES, STATUS_LABELS } from "@/lib/domain";
import { zetInWachtrij } from "@/lib/offline-queue";
import { Kaart, KaartTitel, Label, Pill, PrimaireKnop } from "@/components/ui";
import { Check, Lock } from "@/components/icons";
import type { Status } from "@prisma/client";

type Actie = { id: string; naam: string; isAfkeuren: boolean };

export function RegistratieFormulier({
  materiaalDbId,
  materiaalLabel,
  acties,
  medewerkerNaam,
  nuLabel,
}: {
  materiaalDbId: string;
  materiaalLabel: string;
  acties: Actie[];
  medewerkerNaam: string;
  /** Server-side opgemaakt, zodat server- en clientrender identiek blijven. */
  nuLabel: string;
}) {
  const [state, action, pending] = useActionState<RegistratieState, FormData>(
    registreerOnderhoud,
    undefined
  );
  const [inWachtrij, setInWachtrij] = useState(false);

  const standaard = acties.find((a) => a.naam === "Reparatie") ?? acties[0];
  const [actieId, setActieId] = useState(standaard?.id ?? "");
  const [nieuweStatus, setNieuweStatus] = useState<Status | null>(null);
  const [opmerking, setOpmerking] = useState("");
  // Zodra de medewerker na het opslaan weer iets aanraakt, verdwijnt de
  // bevestiging en staat het formulier klaar voor de volgende registratie.
  const [naOpslaanAangeraakt, setNaOpslaanAangeraakt] = useState(false);
  const bevestigd = (state?.opgeslagen || inWachtrij) && !naOpslaanAangeraakt;

  const gekozen = acties.find((a) => a.id === actieId);
  const isAfkeuring = gekozen?.isAfkeuren ?? false;

  return (
    <Kaart className="desktop:flex-1">
      <form
        action={(formData) => {
          // Idempotentiesleutel pas bij verzenden: een herhaalde verzending (of
          // een regel uit de offline wachtrij) levert nooit een dubbele
          // logregel op, en het renderen blijft deterministisch.
          const clientId = crypto.randomUUID();
          formData.set("clientId", clientId);

          // Zonder bereik blijft registreren gewoon werken: de regel gaat in de
          // wachtrij en wordt verstuurd zodra er weer verbinding is.
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            void zetInWachtrij({
              clientId,
              materiaalDbId,
              materiaalLabel,
              actieId,
              actieNaam: gekozen?.naam ?? "",
              opmerking: String(formData.get("opmerking") ?? ""),
              nieuweStatus: nieuweStatus && !isAfkeuring ? nieuweStatus : undefined,
              tijdstip: Date.now(),
            });
            setInWachtrij(true);
            return;
          }

          setInWachtrij(false);
          action(formData);
          // Formulier leegmaken; de waarden staan al in formData.
          setOpmerking("");
          setNieuweStatus(null);
          setNaOpslaanAangeraakt(false);
        }}
      >
        <KaartTitel>Onderhoud registreren</KaartTitel>

        <input type="hidden" name="materiaalDbId" value={materiaalDbId} />
        <input type="hidden" name="actieId" value={actieId} />
        {nieuweStatus && !isAfkeuring && (
          <input type="hidden" name="nieuweStatus" value={nieuweStatus} />
        )}

        <div className="mt-3">
          <Label>Actie</Label>
          <div className="flex flex-wrap gap-2">
            {acties.map((a) => (
              <Pill
                key={a.id}
                actief={actieId === a.id}
                onClick={() => {
                  setActieId(a.id);
                  setNaOpslaanAangeraakt(true);
                }}
              >
                {a.naam}
              </Pill>
            ))}
          </div>
        </div>

        {isAfkeuring && (
          <div className="mt-3 flex gap-2.5 rounded-input bg-accent-tint p-3 text-accent-ink">
            <Lock size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
            <p className="text-[12.5px] leading-snug">
              Afkeuren moet worden goedgekeurd door beheer. Het materiaal komt op &lsquo;Ter
              goedkeuring&rsquo; en blijft uit de verhuur tot een beheerder de afkeuring bevestigt.
            </p>
          </div>
        )}

        <div className="mt-4">
          <Label htmlFor="opmerking">Opmerking</Label>
          <textarea
            id="opmerking"
            name="opmerking"
            rows={3}
            value={opmerking}
            onChange={(e) => {
              setOpmerking(e.target.value);
              setNaOpslaanAangeraakt(true);
            }}
            placeholder="Wat heb je gedaan of gezien?"
            className="min-h-[82px] w-full rounded-input border border-border-light bg-creme px-3 py-2.5 text-[14px] text-ink placeholder:text-text-muted"
          />
        </div>

        {!isAfkeuring && (
          <div className="mt-4">
            <Label>Status wijzigen (optioneel)</Label>
            <div className="flex flex-wrap gap-2">
              {STATUS_KEUZES.map((s) => (
                <Pill
                  key={s}
                  actief={nieuweStatus === s}
                  // Opnieuw tikken zet de keuze terug op leeg.
                  onClick={() => {
                    setNieuweStatus((huidig) => (huidig === s ? null : s));
                    setNaOpslaanAangeraakt(true);
                  }}
                >
                  {STATUS_LABELS[s]}
                </Pill>
              ))}
            </div>
          </div>
        )}

        {state?.fout && <p className="mt-3 text-[12.5px] text-red-text">{state.fout}</p>}

        <PrimaireKnop
          disabled={pending || !actieId}
          className="mt-4 w-full desktop:min-h-[46px] desktop:w-auto"
        >
          {bevestigd && inWachtrij ? (
            <>
              <Check size={18} strokeWidth={2.4} />
              Opgeslagen in wachtrij
            </>
          ) : bevestigd ? (
            <>
              <Check size={18} strokeWidth={2.4} />
              {state?.afkeuringAangevraagd ? "Afkeuring aangevraagd" : "Onderhoud opgeslagen"}
            </>
          ) : pending ? (
            "Bezig…"
          ) : isAfkeuring ? (
            "Afkeuring aanvragen"
          ) : (
            "Onderhoud opslaan"
          )}
        </PrimaireKnop>

        <p className="mt-2 text-[12px] text-text-muted">
          Wordt gelogd op {nuLabel} door {medewerkerNaam}.
        </p>
      </form>
    </Kaart>
  );
}

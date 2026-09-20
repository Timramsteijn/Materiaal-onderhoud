import { useState, type SubmitEvent as ReactSubmitEvent } from "react";
import { actions } from "astro:actions";

import { Kaart, KaartTitel, Label, Pill, PrimaireKnop } from "@/components/ui";
import { Check, CircleAlert } from "@/components/icons";

type Actie = { id: string; naam: string };

export type OpenMelding = {
  id: string;
  actieNaam: string;
  opmerking: string;
  gemeldDoorNaam: string;
  /** Server-side opgemaakt, zodat server- en clientrender gelijk blijven. */
  gemeldLabel: string;
};

/**
 * "Er moet iets gebeuren" — los van "het is gebeurd". Een instructeur meldt
 * hier wat hij ziet; de werkplaats vinkt de melding af bij het registreren van
 * het uitgevoerde onderhoud.
 */
export function MeldingFormulier({
  materiaalDbId,
  acties,
  meldingen,
  medewerkerNaam,
  nuLabel,
  meldUrl,
  vervalUrl,
}: {
  materiaalDbId: string;
  /** Alleen gewone acties; afkeuren loopt via registreren met goedkeuring. */
  acties: Actie[];
  meldingen: OpenMelding[];
  medewerkerNaam: string;
  nuLabel: string;
  /** URL's van de Astro Actions; ook het doel als JavaScript uitstaat. */
  meldUrl: string;
  vervalUrl: string;
}) {
  const [open, setOpen] = useState(meldingen.length === 0);
  const [actieId, setActieId] = useState("");
  const [opmerking, setOpmerking] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [melding, setMelding] = useState<string | null>(null);

  async function versturen(event: ReactSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("clientId", crypto.randomUUID());

    setBezig(true);
    setFout(null);
    setMelding(null);
    const { data, error } = await actions.meldOnderhoudNodig(formData);
    setBezig(false);

    if (error) {
      setFout(error.message);
      return;
    }
    if (data.dubbel) {
      setMelding("Deze actie stond al open — er is niets bij gekomen.");
      return;
    }
    window.location.reload();
  }

  async function intrekken(id: string) {
    setBezig(true);
    const formData = new FormData();
    formData.set("verzoekId", id);
    const { error } = await actions.laatVerzoekVervallen(formData);
    setBezig(false);
    if (error) {
      setFout(error.message);
      return;
    }
    window.location.reload();
  }

  return (
    <Kaart className={meldingen.length > 0 ? "border-amber-text" : ""}>
      <div className="flex items-center gap-1.5">
        <CircleAlert
          size={16}
          strokeWidth={2.2}
          className={meldingen.length > 0 ? "text-amber-text" : "text-text-muted"}
        />
        <KaartTitel>Onderhoud nodig</KaartTitel>
      </div>

      {meldingen.length === 0 ? (
        <p className="mt-1 text-[12.5px] text-text-muted">
          Niets gemeld. Zie je iets wat moet gebeuren? Meld het hieronder — de werkplaats ziet het
          dan staan.
        </p>
      ) : (
        <ul className="mt-2.5 space-y-2.5">
          {meldingen.map((m) => (
            <li key={m.id} className="rounded-input bg-amber-tint p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-extrabold text-amber-text">{m.actieNaam}</p>
                  {m.opmerking && (
                    <p className="mt-0.5 text-[13px] text-ink">&ldquo;{m.opmerking}&rdquo;</p>
                  )}
                  <p className="mt-0.5 text-[12px] text-text-muted">
                    Gemeld door {m.gemeldDoorNaam} · {m.gemeldLabel}
                  </p>
                </div>
                <form method="post" action={vervalUrl} className="shrink-0">
                  <input type="hidden" name="verzoekId" value={m.id} />
                  <button
                    type="submit"
                    disabled={bezig}
                    onClick={(e) => {
                      e.preventDefault();
                      void intrekken(m.id);
                    }}
                    className="motion text-[11.5px] font-bold text-text-muted hover:text-ink hover:underline disabled:opacity-40"
                  >
                    intrekken
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {meldingen.length > 0 && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="motion mt-3 text-[12px] font-bold text-link hover:underline"
        >
          + nog iets melden
        </button>
      )}

      {(open || meldingen.length === 0) && (
        <form method="post" action={meldUrl} onSubmit={versturen} className="mt-3">
          <input type="hidden" name="materiaalDbId" value={materiaalDbId} />
          <input type="hidden" name="actieId" value={actieId} />
          {/* Zonder JavaScript vult de server zelf geen clientId in. */}
          <input type="hidden" name="clientId" value={`melding:${materiaalDbId}:${nuLabel}`} />

          <Label>Wat moet er gebeuren?</Label>
          <div className="flex flex-wrap gap-2">
            {acties.map((a) => (
              <Pill
                key={a.id}
                actief={actieId === a.id}
                onClick={() => {
                  setActieId(a.id);
                  setMelding(null);
                }}
              >
                {a.naam}
              </Pill>
            ))}
          </div>

          <div className="mt-3">
            <Label htmlFor="melding-opmerking">Toelichting (optioneel)</Label>
            <textarea
              id="melding-opmerking"
              name="opmerking"
              rows={2}
              value={opmerking}
              onChange={(e) => setOpmerking(e.target.value)}
              placeholder="Wat zie je? Bijvoorbeeld: kanten bot, klant meldde wegglijden."
              className="min-h-[62px] w-full rounded-input border border-border-light bg-creme px-3 py-2.5 text-[14px] text-ink placeholder:text-text-muted"
            />
          </div>

          {fout && <p className="mt-3 text-[12.5px] text-red-text">{fout}</p>}
          {melding && (
            <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-text-medium">
              <Check size={15} strokeWidth={2.4} />
              {melding}
            </p>
          )}

          <PrimaireKnop disabled={bezig || !actieId} className="mt-3 w-full desktop:w-auto">
            {bezig ? "Bezig…" : "Onderhoud nodig melden"}
          </PrimaireKnop>

          <p className="mt-2 text-[12px] text-text-muted">
            Komt op naam van {medewerkerNaam} te staan, {nuLabel}. Dit telt niet mee als uitgevoerd
            onderhoud.
          </p>
        </form>
      )}
    </Kaart>
  );
}

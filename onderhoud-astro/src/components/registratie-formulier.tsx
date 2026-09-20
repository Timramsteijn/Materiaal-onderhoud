import { useEffect, useState, type SubmitEvent as ReactSubmitEvent } from "react";
import { actions } from "astro:actions";

import { STATUS_KEUZES, STATUS_LABELS } from "@/lib/domein";
import { zetInWachtrij } from "@/lib/offline-queue";
import { Kaart, KaartTitel, Label, Pill, PrimaireKnop } from "@/components/ui";
import { Check, Lock } from "@/components/icons";
import type { Status } from "@/db/schema";

type Actie = { id: string; naam: string; isAfkeuren: boolean };
type Melding = { id: string; actieNaam: string };

export function RegistratieFormulier({
  materiaalDbId,
  materiaalLabel,
  acties,
  meldingen = [],
  medewerkerNaam,
  nuLabel,
  actieUrl,
}: {
  materiaalDbId: string;
  materiaalLabel: string;
  acties: Actie[];
  /** Open meldingen van dit materiaal; aanvinken rondt ze af. */
  meldingen?: Melding[];
  medewerkerNaam: string;
  /** Server-side opgemaakt, zodat server- en clientrender identiek blijven. */
  nuLabel: string;
  /** URL van de Astro Action; ook het doel als JavaScript uitstaat. */
  actieUrl: string;
}) {
  const standaard = acties.find((a) => a.naam === "Reparatie") ?? acties[0];
  const [actieId, setActieId] = useState(standaard?.id ?? "");
  const [nieuweStatus, setNieuweStatus] = useState<Status | null>(null);
  const [opmerking, setOpmerking] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [inWachtrij, setInWachtrij] = useState(false);
  const [afkeuringAangevraagd, setAfkeuringAangevraagd] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);
  // Zodra de medewerker na het opslaan weer iets aanraakt, verdwijnt de
  // bevestiging en staat het formulier klaar voor de volgende registratie.
  const [naOpslaanAangeraakt, setNaOpslaanAangeraakt] = useState(false);
  const bevestigd = (opgeslagen || inWachtrij) && !naOpslaanAangeraakt;

  const gekozen = acties.find((a) => a.id === actieId);
  const isAfkeuring = gekozen?.isAfkeuren ?? false;

  // Meldingen voor dezelfde actie staan meteen aangevinkt: dat is bijna altijd
  // wat er gebeurt. Handmatig aanpassen blijft mogelijk.
  const [afgevinkt, setAfgevinkt] = useState<string[]>([]);
  useEffect(() => {
    setAfgevinkt(meldingen.filter((m) => m.actieNaam === gekozen?.naam).map((m) => m.id));
  }, [actieId]);

  async function verstuur(event: ReactSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Idempotentiesleutel pas bij verzenden: een herhaalde verzending (of een
    // regel uit de offline wachtrij) levert nooit een dubbele logregel op, en
    // het renderen blijft deterministisch.
    const clientId = crypto.randomUUID();
    formData.set("clientId", clientId);

    // Zonder bereik blijft registreren gewoon werken: de regel gaat in de
    // wachtrij en wordt verstuurd zodra er weer verbinding is.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await zetInWachtrij({
        clientId,
        materiaalDbId,
        materiaalLabel,
        actieId,
        actieNaam: gekozen?.naam ?? "",
        opmerking: String(formData.get("opmerking") ?? ""),
        nieuweStatus: nieuweStatus && !isAfkeuring ? nieuweStatus : undefined,
        verzoekIds: isAfkeuring ? [] : afgevinkt,
        tijdstip: Date.now(),
      });
      setInWachtrij(true);
      setOpmerking("");
      setNieuweStatus(null);
      setNaOpslaanAangeraakt(false);
      return;
    }

    setBezig(true);
    setFout(null);
    const { data, error } = await actions.registreerOnderhoud(formData);
    setBezig(false);

    if (error) {
      setFout(error.message);
      return;
    }

    setInWachtrij(false);
    setOpgeslagen(Boolean(data.opgeslagen));
    setAfkeuringAangevraagd(Boolean(data.afkeuringAangevraagd));
    setOpmerking("");
    setNieuweStatus(null);
    setNaOpslaanAangeraakt(false);
    // De pagina toont de nieuwe historie en status pas na een verse render.
    window.location.reload();
  }

  return (
    <Kaart className="desktop:flex-1">
      <form method="post" action={actieUrl} onSubmit={verstuur}>
        <KaartTitel>Onderhoud registreren</KaartTitel>

        <input type="hidden" name="materiaalDbId" value={materiaalDbId} />
        <input type="hidden" name="actieId" value={actieId} />
        {/* Zonder JavaScript vult de server zelf geen clientId in. */}
        <input type="hidden" name="clientId" value={`form:${materiaalDbId}:${nuLabel}`} />
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

        {meldingen.length > 0 && !isAfkeuring && (
          <div className="mt-4">
            <Label>Hiermee afgehandeld</Label>
            <div className="space-y-1.5">
              {meldingen.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2.5 text-[13.5px] text-ink"
                >
                  <input
                    type="checkbox"
                    name="verzoekIds"
                    value={m.id}
                    checked={afgevinkt.includes(m.id)}
                    onChange={(e) => {
                      setAfgevinkt((huidig) =>
                        e.target.checked
                          ? [...huidig, m.id]
                          : huidig.filter((id) => id !== m.id)
                      );
                      setNaOpslaanAangeraakt(true);
                    }}
                    className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                  />
                  <span>
                    {m.actieNaam}
                    <span className="text-text-muted"> — gemelde klus sluiten</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

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

        {fout && <p className="mt-3 text-[12.5px] text-red-text">{fout}</p>}

        <PrimaireKnop
          disabled={bezig || !actieId}
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
              {afkeuringAangevraagd ? "Afkeuring aangevraagd" : "Onderhoud opgeslagen"}
            </>
          ) : bezig ? (
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

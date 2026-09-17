import { useState, type SubmitEvent as ReactSubmitEvent } from "react";
import { actions } from "astro:actions";

import { ROL_LABELS } from "@/lib/domein";
import { Kaart, KaartTitel, Label, inputClass } from "@/components/ui";
import { BevestigModal } from "@/components/bevestig-modal";
import { Plus, UserX } from "@/components/icons";
import type { Rol } from "@/db/schema";

type Medewerker = {
  id: string;
  naam: string;
  rol: Rol;
  functie: string;
  actief: boolean;
  /** Registraties plus beheerwijzigingen op naam; die historie blijft altijd staan. */
  historie: number;
};

export function MedewerkerBeheer({
  medewerkers,
  huidigeId,
  medewerkerNaam,
  toevoegUrl,
  actiefUrl,
  verwijderUrl,
}: {
  medewerkers: Medewerker[];
  huidigeId: string;
  medewerkerNaam: string;
  /** URL's van de Astro Actions; ook het doel als JavaScript uitstaat. */
  toevoegUrl: string;
  actiefUrl: string;
  verwijderUrl: string;
}) {
  const [nieuw, setNieuw] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [teDeactiveren, setTeDeactiveren] = useState<Medewerker | null>(null);
  const [teVerwijderen, setTeVerwijderen] = useState<Medewerker | null>(null);

  // Verwijderen mag pas ná deactiveren, en nooit als er historie op naam staat.
  const magVerwijderen = (m: Medewerker) => !m.actief && m.id !== huidigeId && m.historie === 0;

  async function toevoegen(event: ReactSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    const { error } = await actions.voegMedewerkerToe(new FormData(event.currentTarget));
    setBezig(false);
    if (error) {
      setFout(error.message);
      return;
    }
    window.location.reload();
  }

  async function zetActief(id: string, actief: boolean) {
    setBezig(true);
    const formData = new FormData();
    formData.set("medewerkerId", id);
    // Letterlijk "false" sturen: Astro leest een leeg veld dat wél aanwezig is
    // als true, waardoor deactiveren niets deed.
    formData.set("actief", actief ? "true" : "false");
    await actions.zetMedewerkerActief(formData);
    window.location.reload();
  }

  async function verwijderen(id: string) {
    setBezig(true);
    setFout(null);
    const formData = new FormData();
    formData.set("medewerkerId", id);
    const { error } = await actions.verwijderMedewerker(formData);
    setBezig(false);
    if (error) {
      setTeVerwijderen(null);
      setFout(error.message);
      return;
    }
    window.location.reload();
  }

  return (
    <Kaart>
      <div className="flex items-center justify-between gap-2">
        <KaartTitel>Medewerkers</KaartTitel>
        <button
          type="button"
          onClick={() => setNieuw((v) => !v)}
          className="motion flex items-center gap-1 text-[11.5px] font-bold text-link hover:underline"
        >
          <Plus size={13} strokeWidth={2.4} />
          nieuw
        </button>
      </div>

      <ul className="mt-3 divide-y divide-zand">
        {medewerkers.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold text-ink">{m.naam}</p>
              <p className="text-[12px] text-text-muted">{m.functie || ROL_LABELS[m.rol]}</p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] ${
                  m.actief ? "bg-green-tint text-green-text" : "bg-neutral-fill text-text-muted"
                }`}
              >
                {m.actief ? "Actief" : "Inactief"}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {!m.actief && m.id !== huidigeId && (
                magVerwijderen(m) ? (
                  <button
                    type="button"
                    disabled={bezig}
                    onClick={() => setTeVerwijderen(m)}
                    className="motion text-[11.5px] font-bold text-red-text hover:underline disabled:opacity-40"
                  >
                    verwijderen
                  </button>
                ) : (
                  <span
                    className="text-[11.5px] text-text-muted"
                    title="Deze medewerker staat in de historie en kan daarom niet meer verwijderd worden."
                  >
                    {m.historie} in historie
                  </span>
                )
              )}

              <button
                type="button"
                role="switch"
                aria-checked={m.actief}
                aria-label={`${m.naam} ${m.actief ? "deactiveren" : "activeren"}`}
                disabled={m.id === huidigeId || bezig}
                onClick={() => {
                  if (m.actief) setTeDeactiveren(m);
                  else void zetActief(m.id, true);
                }}
                className={`motion relative h-[26px] w-[44px] rounded-full disabled:opacity-40 ${
                  m.actief ? "bg-green-figure" : "bg-toggle-off"
                }`}
              >
                {/* left-0 is nodig: zonder houvast zet de browser het bolletje
                    gecentreerd, en dan schuift het buiten het spoor. */}
                <span
                  className={`motion absolute left-0 top-[3px] h-5 w-5 rounded-full bg-creme ${
                    m.actief ? "translate-x-[21px]" : "translate-x-[3px]"
                  }`}
                />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {nieuw && (
        <form
          method="post"
          action={toevoegUrl}
          onSubmit={toevoegen}
          className="mt-3 border-t border-zand pt-3"
        >
          <div className="grid gap-3 desktop:grid-cols-2">
            <div>
              <Label htmlFor="mw-naam">Naam</Label>
              <input id="mw-naam" name="naam" required className={inputClass} />
            </div>
            <div>
              <Label htmlFor="mw-gebruikersnaam">Gebruikersnaam</Label>
              <input
                id="mw-gebruikersnaam"
                name="gebruikersnaam"
                required
                placeholder="bv. j.jansen"
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="mw-wachtwoord">Tijdelijk wachtwoord</Label>
              <input
                id="mw-wachtwoord"
                name="wachtwoord"
                type="password"
                required
                minLength={8}
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="mw-rol">Rol</Label>
              <select id="mw-rol" name="rol" defaultValue="MEDEWERKER" className={inputClass}>
                {(Object.keys(ROL_LABELS) as Rol[]).map((r) => (
                  <option key={r} value={r}>
                    {ROL_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="desktop:col-span-2">
              <Label htmlFor="mw-functie">Functie</Label>
              <input
                id="mw-functie"
                name="functie"
                placeholder="bv. Medewerker · werkplaats"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={bezig}
            className="motion mt-3 h-11 rounded-full bg-accent px-5 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed disabled:opacity-60"
          >
            {bezig ? "Opslaan…" : "Medewerker toevoegen"}
          </button>
        </form>
      )}

      {fout && <p className="mt-3 text-[12.5px] text-red-text">{fout}</p>}

      {/* Zonder JavaScript blijft (de)activeren bereikbaar via dit formulier. */}
      <noscript>
        <form method="post" action={actiefUrl} className="mt-3 border-t border-zand pt-3">
          <Label htmlFor="mw-actief-id">Medewerker (de)activeren</Label>
          <select id="mw-actief-id" name="medewerkerId" className={inputClass}>
            {medewerkers
              .filter((m) => m.id !== huidigeId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.naam} — nu {m.actief ? "actief" : "inactief"}
                </option>
              ))}
          </select>
          <label className="mt-2 flex items-center gap-2 text-[13px] text-ink">
            <input type="checkbox" name="actief" value="true" />
            Actief
          </label>
          <button
            type="submit"
            className="motion mt-2 h-11 rounded-full bg-navy px-5 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-creme"
          >
            Opslaan
          </button>
        </form>

        {medewerkers.some(magVerwijderen) && (
          <form method="post" action={verwijderUrl} className="mt-3 border-t border-zand pt-3">
            <Label htmlFor="mw-verwijder-id">Gedeactiveerde medewerker verwijderen</Label>
            <select id="mw-verwijder-id" name="medewerkerId" className={inputClass}>
              {medewerkers.filter(magVerwijderen).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.naam}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="motion mt-2 h-11 rounded-full bg-red-text px-5 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-creme"
            >
              Verwijderen
            </button>
          </form>
        )}
      </noscript>

      {teDeactiveren && (
        <BevestigModal
          vraag={`${teDeactiveren.naam} deactiveren?`}
          gevolgen="De medewerker kan niet meer inloggen. Bestaande registraties blijven op naam staan en worden niet gewijzigd."
          medewerkerNaam={medewerkerNaam}
          bezig={bezig}
          bevestigLabel="Deactiveren"
          icoon={<UserX size={15} strokeWidth={2} />}
          onAnnuleer={() => setTeDeactiveren(null)}
          onBevestig={() => void zetActief(teDeactiveren.id, false)}
        />
      )}

      {teVerwijderen && (
        <BevestigModal
          vraag={`${teVerwijderen.naam} definitief verwijderen?`}
          gevolgen="Het account verdwijnt uit de lijst en komt niet meer terug. Dit kan alleen omdat er geen registraties op deze naam staan."
          medewerkerNaam={medewerkerNaam}
          bezig={bezig}
          onAnnuleer={() => setTeVerwijderen(null)}
          onBevestig={() => void verwijderen(teVerwijderen.id)}
        />
      )}
    </Kaart>
  );
}

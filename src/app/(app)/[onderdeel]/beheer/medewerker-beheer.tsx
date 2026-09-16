"use client";

import { useActionState, useState, useTransition } from "react";
import { voegMedewerkerToe, zetMedewerkerActief, type BeheerState } from "@/lib/actions/beheer";
import { ROL_LABELS } from "@/lib/domain";
import { Kaart, KaartTitel, Label, inputClass } from "@/components/ui";
import { BevestigModal } from "@/components/bevestig-modal";
import { Plus } from "@/components/icons";
import type { Rol } from "@prisma/client";

type Medewerker = { id: string; naam: string; rol: Rol; functie: string; actief: boolean };

export function MedewerkerBeheer({
  slug,
  medewerkers,
  huidigeId,
  medewerkerNaam,
}: {
  slug: string;
  medewerkers: Medewerker[];
  huidigeId: string;
  medewerkerNaam: string;
}) {
  const [nieuw, setNieuw] = useState(false);
  const [state, action, pending] = useActionState<BeheerState, FormData>(
    voegMedewerkerToe,
    undefined
  );
  const [bezig, start] = useTransition();
  const [teDeactiveren, setTeDeactiveren] = useState<Medewerker | null>(null);

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
              <p className="text-[12px] text-text-muted">
                {m.functie || ROL_LABELS[m.rol]}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] ${
                  m.actief ? "bg-green-tint text-green-text" : "bg-neutral-fill text-text-muted"
                }`}
              >
                {m.actief ? "Actief" : "Inactief"}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={m.actief}
              aria-label={`${m.naam} ${m.actief ? "deactiveren" : "activeren"}`}
              disabled={m.id === huidigeId || bezig}
              onClick={() => {
                if (m.actief) setTeDeactiveren(m);
                else start(() => zetMedewerkerActief(m.id, true, slug));
              }}
              className={`motion relative h-[26px] w-[44px] shrink-0 rounded-full disabled:opacity-40 ${
                m.actief ? "bg-green-figure" : "bg-toggle-off"
              }`}
            >
              <span
                className={`motion absolute top-[3px] h-5 w-5 rounded-full bg-creme ${
                  m.actief ? "translate-x-[21px]" : "translate-x-[3px]"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>

      {nieuw && (
        <form action={action} className="mt-3 border-t border-zand pt-3">
          <input type="hidden" name="slug" value={slug} />
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

          {state?.fout && <p className="mt-2 text-[12.5px] text-red-text">{state.fout}</p>}

          <button
            type="submit"
            disabled={pending}
            className="motion mt-3 h-11 rounded-full bg-accent px-5 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed disabled:opacity-60"
          >
            {pending ? "Opslaan…" : "Medewerker toevoegen"}
          </button>
        </form>
      )}

      {teDeactiveren && (
        <BevestigModal
          vraag={`${teDeactiveren.naam} deactiveren?`}
          gevolgen="De medewerker kan niet meer inloggen. Bestaande registraties blijven op naam staan en worden niet gewijzigd."
          medewerkerNaam={medewerkerNaam}
          bezig={bezig}
          onAnnuleer={() => setTeDeactiveren(null)}
          onBevestig={() =>
            start(async () => {
              await zetMedewerkerActief(teDeactiveren.id, false, slug);
              setTeDeactiveren(null);
            })
          }
        />
      )}
    </Kaart>
  );
}

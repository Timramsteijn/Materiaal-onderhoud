"use client";

import { useActionState, useState, useTransition } from "react";
import { bewerkMateriaal, verwijderMateriaal, type MateriaalState } from "@/lib/actions/materiaal";
import { Kaart, Label, inputClass } from "@/components/ui";
import { Trash2 } from "@/components/icons";
import { BevestigModal } from "@/components/bevestig-modal";

type Veld = { id: string; naam: string; eenheid: string | null; waarde: string };

export function MateriaalBewerken({
  materiaal,
  velden,
  magVerwijderen,
}: {
  materiaal: { id: string; merkModel: string; locatie: string; inGebruikSinds: string };
  velden: Veld[];
  magVerwijderen: boolean;
}) {
  const [state, action, pending] = useActionState<MateriaalState, FormData>(
    bewerkMateriaal,
    undefined
  );
  const [verwijderOpen, setVerwijderOpen] = useState(false);
  const [bezigMetVerwijderen, startVerwijderen] = useTransition();

  return (
    <Kaart>
      <details>
        <summary className="cursor-pointer text-[12px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
          Gegevens bewerken
        </summary>

        <form action={action} className="mt-3">
          <input type="hidden" name="materiaalDbId" value={materiaal.id} />

          <div className="grid gap-3 desktop:grid-cols-2">
            <div>
              <Label htmlFor="merkModel">Merk / model</Label>
              <input
                id="merkModel"
                name="merkModel"
                defaultValue={materiaal.merkModel}
                required
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="locatie">Locatie</Label>
              <input
                id="locatie"
                name="locatie"
                defaultValue={materiaal.locatie}
                placeholder="bv. Rek A-03"
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="inGebruikSinds">In gebruik sinds</Label>
              <input
                id="inGebruikSinds"
                name="inGebruikSinds"
                type="date"
                defaultValue={materiaal.inGebruikSinds}
                className={inputClass}
              />
            </div>

            {/* Volledig datagestuurd: de velddefinities komen uit de categorie. */}
            {velden.map((veld) => (
              <div key={veld.id}>
                <Label htmlFor={`veld-${veld.id}`}>
                  {veld.naam}
                  {veld.eenheid ? ` (${veld.eenheid})` : ""}
                </Label>
                <input
                  id={`veld-${veld.id}`}
                  name={`veld:${veld.id}`}
                  defaultValue={veld.waarde}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          {state?.fout && <p className="mt-3 text-[12.5px] text-red-text">{state.fout}</p>}

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="submit"
              disabled={pending}
              className="motion flex min-h-[44px] items-center rounded-full bg-navy px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-creme hover:bg-navy-light disabled:opacity-60"
            >
              {pending ? "Opslaan…" : "Wijzigingen opslaan"}
            </button>

            {magVerwijderen && (
              <button
                type="button"
                onClick={() => setVerwijderOpen(true)}
                className="motion flex min-h-[44px] items-center gap-2 rounded-full border-[1.5px] border-red-text px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-red-text hover:bg-red-tint"
              >
                <Trash2 size={15} strokeWidth={2} />
                Verwijderen
              </button>
            )}
          </div>
        </form>
      </details>

      {verwijderOpen && (
        <BevestigModal
          vraag="Dit materiaal verwijderen?"
          gevolgen="De bestaande registraties in het onderhoudslog verdwijnen mee — dit kan niet ongedaan worden gemaakt."
          bezig={bezigMetVerwijderen}
          onAnnuleer={() => setVerwijderOpen(false)}
          onBevestig={() => startVerwijderen(() => verwijderMateriaal(materiaal.id))}
        />
      )}
    </Kaart>
  );
}

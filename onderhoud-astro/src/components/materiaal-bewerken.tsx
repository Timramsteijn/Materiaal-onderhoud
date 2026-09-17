import { useState, type SubmitEvent as ReactSubmitEvent } from "react";
import { actions } from "astro:actions";

import { Kaart, Label, inputClass } from "@/components/ui";
import { Trash2 } from "@/components/icons";
import { BevestigModal } from "@/components/bevestig-modal";

type Veld = { id: string; naam: string; eenheid: string | null; waarde: string };

export function MateriaalBewerken({
  materiaal,
  velden,
  magVerwijderen,
  bewerkUrl,
  verwijderUrl,
}: {
  materiaal: { id: string; merkModel: string; locatie: string; inGebruikSinds: string };
  velden: Veld[];
  magVerwijderen: boolean;
  /** URL's van de Astro Actions; ook het doel als JavaScript uitstaat. */
  bewerkUrl: string;
  verwijderUrl: string;
}) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [verwijderOpen, setVerwijderOpen] = useState(false);
  const [bezigMetVerwijderen, setBezigMetVerwijderen] = useState(false);

  async function opslaan(event: ReactSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    const { error } = await actions.bewerkMateriaal(new FormData(event.currentTarget));
    setBezig(false);
    if (error) {
      setFout(error.message);
      return;
    }
    window.location.reload();
  }

  async function verwijderen() {
    setBezigMetVerwijderen(true);
    const formData = new FormData();
    formData.set("materiaalDbId", materiaal.id);
    const { data, error } = await actions.verwijderMateriaal(formData);
    setBezigMetVerwijderen(false);
    if (error) {
      setVerwijderOpen(false);
      setFout(error.message);
      return;
    }
    window.location.assign(`/${data.slug}/materiaal`);
  }

  return (
    <Kaart>
      <details>
        <summary className="cursor-pointer text-[12px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
          Gegevens bewerken
        </summary>

        <form method="post" action={bewerkUrl} onSubmit={opslaan} className="mt-3">
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

          {fout && <p className="mt-3 text-[12.5px] text-red-text">{fout}</p>}

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="submit"
              disabled={bezig}
              className="motion flex min-h-[44px] items-center rounded-full bg-navy px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-creme hover:bg-navy-light disabled:opacity-60"
            >
              {bezig ? "Opslaan…" : "Wijzigingen opslaan"}
            </button>
          </div>
        </form>

        {magVerwijderen && (
          // Los formulier, zodat verwijderen ook zonder JavaScript werkt.
          <form method="post" action={verwijderUrl} className="mt-2.5">
            <input type="hidden" name="materiaalDbId" value={materiaal.id} />
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                setVerwijderOpen(true);
              }}
              className="motion flex min-h-[44px] items-center gap-2 rounded-full border-[1.5px] border-red-text px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-red-text hover:bg-red-tint"
            >
              <Trash2 size={15} strokeWidth={2} />
              Verwijderen
            </button>
          </form>
        )}
      </details>

      {verwijderOpen && (
        <BevestigModal
          vraag="Dit materiaal verwijderen?"
          gevolgen="De bestaande registraties in het onderhoudslog verdwijnen mee — dit kan niet ongedaan worden gemaakt."
          bezig={bezigMetVerwijderen}
          onAnnuleer={() => setVerwijderOpen(false)}
          onBevestig={verwijderen}
        />
      )}
    </Kaart>
  );
}

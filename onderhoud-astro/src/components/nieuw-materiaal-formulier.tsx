import { useState, type SubmitEvent as ReactSubmitEvent } from "react";
import { actions } from "astro:actions";

import { Kaart, Label, Pill, PrimaireKnop, OutlineKnop, inputClass } from "@/components/ui";
import { Check } from "@/components/icons";

export function NieuwMateriaalFormulier({
  slug,
  onderdeelId,
  categorieen,
  beginId,
  vandaag,
  actieUrl,
}: {
  slug: string;
  onderdeelId: string;
  categorieen: { id: string; naam: string }[];
  beginId: string;
  /** Server-side opgemaakt, zodat server- en clientrender identiek blijven. */
  vandaag: string;
  actieUrl: string;
}) {
  const [categorieId, setCategorieId] = useState(categorieen[0]?.id ?? "");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function opslaan(event: ReactSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    const { data, error } = await actions.maakMateriaal(new FormData(event.currentTarget));
    setBezig(false);
    if (error) {
      setFout(error.message);
      return;
    }
    window.location.assign(`/${data.slug}/materiaal/${encodeURIComponent(data.materiaalId)}`);
  }

  return (
    <Kaart className="desktop:max-w-[820px]">
      <form method="post" action={actieUrl} onSubmit={opslaan}>
        <input type="hidden" name="onderdeelId" value={onderdeelId} />
        <input type="hidden" name="categorieId" value={categorieId} />

        <div className="grid gap-4 desktop:grid-cols-2">
          <div>
            <Label htmlFor="materiaalId">Materiaal-ID</Label>
            <input
              id="materiaalId"
              name="materiaalId"
              defaultValue={beginId}
              placeholder="bv. SKI-1240"
              required
              autoFocus
              className={`${inputClass} uppercase`}
            />
            <p className="mt-1 text-[12px] text-text-muted">
              Moet exact overeenkomen met de QR-sticker.
            </p>
          </div>

          <div>
            <Label htmlFor="inGebruikSinds">In gebruik sinds</Label>
            <input
              id="inGebruikSinds"
              name="inGebruikSinds"
              type="date"
              defaultValue={vandaag}
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="merkModel">Merk / model</Label>
            <input
              id="merkModel"
              name="merkModel"
              placeholder="bv. Rossignol Experience 78"
              required
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="locatie">Locatie</Label>
            <input id="locatie" name="locatie" placeholder="bv. Rek A-03" className={inputClass} />
          </div>
        </div>

        <div className="mt-4">
          <Label>Categorie</Label>
          <div className="flex flex-wrap gap-2">
            {categorieen.map((c) => (
              <Pill key={c.id} actief={categorieId === c.id} onClick={() => setCategorieId(c.id)}>
                {c.naam}
              </Pill>
            ))}
          </div>
        </div>

        <p className="mt-4 rounded-input bg-neutral-fill px-3 py-2.5 text-[12.5px] text-text-muted">
          De eigen velden van de categorie vul je aan op het materiaalkaartje.
        </p>

        {fout && <p className="mt-3 text-[12.5px] text-red-text">{fout}</p>}

        <div className="mt-5 flex flex-col gap-2.5 desktop:flex-row">
          <PrimaireKnop disabled={bezig || !categorieId}>
            <Check size={18} strokeWidth={2.4} />
            {bezig ? "Opslaan…" : "Materiaal opslaan"}
          </PrimaireKnop>
          <OutlineKnop href={`/${slug}/materiaal`}>Annuleren</OutlineKnop>
        </div>
      </form>
    </Kaart>
  );
}

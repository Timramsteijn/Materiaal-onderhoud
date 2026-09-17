import { useState, type SubmitEvent as ReactSubmitEvent } from "react";
import { actions } from "astro:actions";

import { Kaart, Label, Pill, PrimaireKnop, OutlineKnop, inputClass } from "@/components/ui";
import { Check } from "@/components/icons";
import { VeldInvoer, type VeldInvoerDefinitie } from "@/components/veld-invoer";

export type NieuweCategorie = {
  id: string;
  naam: string;
  velden: VeldInvoerDefinitie[];
};

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
  categorieen: NieuweCategorie[];
  beginId: string;
  /** Server-side opgemaakt, zodat server- en clientrender identiek blijven. */
  vandaag: string;
  actieUrl: string;
}) {
  const [categorieId, setCategorieId] = useState(categorieen[0]?.id ?? "");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const gekozen = categorieen.find((c) => c.id === categorieId);

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

        {/* De velden horen bij de categorie, dus ze wisselen mee met de keuze. */}
        {gekozen && gekozen.velden.length > 0 && (
          <div className="mt-4 border-t border-zand pt-4">
            <h3 className="font-body mb-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-link">
              Velden van categorie {gekozen.naam}
            </h3>
            <div className="grid gap-3 desktop:grid-cols-2">
              {gekozen.velden.map((veld) => (
                // key op de categorie: bij het wisselen beginnen de velden leeg.
                <VeldInvoer key={`${gekozen.id}-${veld.id}`} veld={veld} idVoorvoegsel="nieuw" />
              ))}
            </div>
            <p className="mt-2 text-[12px] text-text-muted">
              Niet alles bij de hand? Laat leeg — je kunt het later op het materiaalkaartje
              aanvullen.
            </p>
          </div>
        )}

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

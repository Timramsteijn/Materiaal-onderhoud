import { useState, type SubmitEvent as ReactSubmitEvent } from "react";
import { actions } from "astro:actions";

import { Kaart, KaartTitel, Label, inputClass } from "@/components/ui";

/** Matafmeting + basisleeftijd — de twee instellingen die de berekeningen sturen. */
export function BaanschetsInstellingen({
  breedteM,
  hoogteM,
  basisleeftijdSeizoenen,
  url,
}: {
  breedteM: number;
  hoogteM: number;
  basisleeftijdSeizoenen: number;
  /** URL van de Astro Action; ook het doel als JavaScript uitstaat. */
  url: string;
}) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [opgeslagen, setOpgeslagen] = useState(false);

  async function opslaan(event: ReactSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    setOpgeslagen(false);
    const { error } = await actions.zetBaanschetsInstellingen(new FormData(event.currentTarget));
    setBezig(false);
    if (error) {
      setFout(error.message);
      return;
    }
    setOpgeslagen(true);
    window.location.reload();
  }

  return (
    <Kaart>
      <KaartTitel>Onderhoud</KaartTitel>
      <p className="mb-3 mt-1 text-[12.5px] text-text-muted">
        De matafmeting bepaalt alle m²-berekeningen; de basisleeftijd is het aantal seizoenen dat
        een mat meegaat voordat hij als "oud" telt.
      </p>
      <form method="post" action={url} onSubmit={opslaan} className="grid gap-3 desktop:grid-cols-3">
        <div>
          <Label htmlFor="bs-breedte">Breedte (m)</Label>
          <input
            id="bs-breedte"
            name="breedteM"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={breedteM}
            required
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor="bs-hoogte">Hoogte (m)</Label>
          <input
            id="bs-hoogte"
            name="hoogteM"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={hoogteM}
            required
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor="bs-basisleeftijd">Basisleeftijd (seizoenen)</Label>
          <input
            id="bs-basisleeftijd"
            name="basisleeftijdSeizoenen"
            type="number"
            step="1"
            min="0"
            defaultValue={basisleeftijdSeizoenen}
            required
            className={inputClass}
          />
        </div>

        {fout && <p className="desktop:col-span-3 text-[12.5px] text-red-text">{fout}</p>}

        <button
          type="submit"
          disabled={bezig}
          className="motion flex h-11 items-center justify-center rounded-full bg-accent px-5 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed disabled:opacity-60 desktop:col-span-3 desktop:w-fit"
        >
          {bezig ? "Opslaan…" : opgeslagen ? "Opgeslagen" : "Opslaan"}
        </button>
      </form>
    </Kaart>
  );
}

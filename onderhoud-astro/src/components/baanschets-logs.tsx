import { useState, type ReactNode, type SubmitEvent as ReactSubmitEvent } from "react";
import { actions } from "astro:actions";

import { Label, inputClass } from "@/components/ui";
import { Plus } from "@/components/icons";

/** Gedeeld skelet: "+ toevoegen"-knop die een formulier uitklapt, met inline foutmelding. */
function ToevoegBlok({
  label,
  url,
  versturen,
  kinderen,
}: {
  label: string;
  url: string;
  versturen: (formData: FormData) => Promise<{ error?: { message: string } | undefined }>;
  kinderen: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function opslaan(event: ReactSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    const { error } = await versturen(new FormData(event.currentTarget));
    setBezig(false);
    if (error) {
      setFout(error.message);
      return;
    }
    window.location.reload();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="motion mt-3 flex items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-link px-3 py-2 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-link hover:bg-accent-tint"
      >
        <Plus size={14} strokeWidth={2.4} />
        {label}
      </button>
    );
  }

  return (
    <form method="post" action={url} onSubmit={opslaan} className="mt-3 grid gap-3 desktop:grid-cols-4">
      {kinderen}
      {fout && <p className="text-[12.5px] text-red-text desktop:col-span-4">{fout}</p>}
      <div className="flex gap-2 desktop:col-span-4">
        <button
          type="submit"
          disabled={bezig}
          className="motion h-10 rounded-full bg-accent px-5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-accent-on disabled:opacity-60"
        >
          {bezig ? "Opslaan…" : "Opslaan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="motion h-10 rounded-full border-[1.5px] border-border-light px-5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-text-medium"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}

export function BaanschetsRotatieForm({ url }: { url: string }) {
  return (
    <ToevoegBlok
      label="Rotatie toevoegen"
      url={url}
      versturen={(fd) => actions.voegBaanschetsRotatieToe(fd)}
      kinderen={
        <>
          <div>
            <Label htmlFor="rot-seizoen">Seizoen</Label>
            <input
              id="rot-seizoen"
              name="seizoen"
              required
              placeholder="2026/27"
              className={inputClass}
            />
          </div>
          <div>
            <Label htmlFor="rot-van">Van sectie</Label>
            <input id="rot-van" name="van" required placeholder="2" className={inputClass} />
          </div>
          <div>
            <Label htmlFor="rot-naar">Naar sectie</Label>
            <input
              id="rot-naar"
              name="naar"
              required
              placeholder="6 of Reserve"
              className={inputClass}
            />
          </div>
          <div className="desktop:col-span-4">
            <Label htmlFor="rot-toelichting">Toelichting</Label>
            <textarea
              id="rot-toelichting"
              name="toelichting"
              rows={2}
              className="w-full rounded-input border border-border-light bg-creme px-3 py-2 text-[13.5px] text-ink"
            />
          </div>
        </>
      }
    />
  );
}

export function BaanschetsNieuweMattenForm({ url }: { url: string }) {
  return (
    <ToevoegBlok
      label="Nieuwe matten toevoegen"
      url={url}
      versturen={(fd) => actions.voegBaanschetsNieuweMattenToe(fd)}
      kinderen={
        <>
          <div>
            <Label htmlFor="nm-seizoen">Seizoen</Label>
            <input
              id="nm-seizoen"
              name="seizoen"
              required
              placeholder="2026/27"
              className={inputClass}
            />
          </div>
          <div>
            <Label htmlFor="nm-aantal">Aantal</Label>
            <input
              id="nm-aantal"
              name="aantal"
              type="number"
              min={1}
              required
              className={inputClass}
            />
          </div>
          <div>
            <Label htmlFor="nm-leeftijd">Leeftijd bij opname</Label>
            <input
              id="nm-leeftijd"
              name="leeftijdBijOpname"
              type="number"
              min={0}
              required
              className={inputClass}
            />
          </div>
          <div>
            <Label htmlFor="nm-vanuit">Vanuit sectie</Label>
            <input id="nm-vanuit" name="vanuit" placeholder="2" className={inputClass} />
          </div>
          <div className="desktop:col-span-4">
            <Label htmlFor="nm-toelichting">Toelichting</Label>
            <textarea
              id="nm-toelichting"
              name="toelichting"
              rows={2}
              className="w-full rounded-input border border-border-light bg-creme px-3 py-2 text-[13.5px] text-ink"
            />
          </div>
        </>
      }
    />
  );
}

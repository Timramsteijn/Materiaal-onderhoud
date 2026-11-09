import { useState } from "react";
import { actions } from "astro:actions";

import { Label } from "@/components/ui";
import { X } from "@/components/icons";

type Actie = { id: string; naam: string };
type Hotspot = { id: string; actieId: string; label: string; xPct: number; yPct: number };

/**
 * Beheerders zetten hier zelf stippen op de foto, gekoppeld aan een
 * bestaande actie — geen code-wijziging nodig als er een nieuwe
 * onderhoudsactie bijkomt die ook op de foto moet kunnen. Klikken op de
 * foto plaatst een tijdelijke stip; labelen en opslaan maakt 'm definitief.
 */
export function FietsHotspotBeheer({
  fotoUrl,
  acties,
  hotspots,
}: {
  fotoUrl: string;
  acties: Actie[];
  hotspots: Hotspot[];
}) {
  const [actieId, setActieId] = useState(acties[0]?.id ?? "");
  const [nieuwePositie, setNieuwePositie] = useState<{ xPct: number; yPct: number } | null>(null);
  const [label, setLabel] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  function fotoKlik(event: React.MouseEvent<HTMLDivElement>) {
    if (!actieId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100;
    const yPct = ((event.clientY - rect.top) / rect.height) * 100;
    setNieuwePositie({ xPct, yPct });
    setFout(null);
    const actie = acties.find((a) => a.id === actieId);
    setLabel(actie?.naam.split(" ")[0] ?? "");
  }

  async function opslaan() {
    if (!nieuwePositie) return;
    setBezig(true);
    setFout(null);
    const formData = new FormData();
    formData.set("actieId", actieId);
    formData.set("label", label);
    formData.set("xPct", String(nieuwePositie.xPct));
    formData.set("yPct", String(nieuwePositie.yPct));
    const { error } = await actions.voegFietsHotspotToe(formData);
    setBezig(false);
    if (error) {
      setFout(error.message);
      return;
    }
    window.location.reload();
  }

  async function verwijder(hotspotId: string) {
    setBezig(true);
    const formData = new FormData();
    formData.set("hotspotId", hotspotId);
    await actions.verwijderFietsHotspot(formData);
    window.location.reload();
  }

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-text-muted">
        Plek op de foto
      </p>

      <div className="mb-2">
        <Label htmlFor="hotspot-actie">Nieuwe stip voor</Label>
        <select
          id="hotspot-actie"
          value={actieId}
          onChange={(e) => {
            setActieId(e.target.value);
            setNieuwePositie(null);
          }}
          className="h-9 w-full rounded-input border border-border-light bg-creme px-2.5 text-[12.5px] text-ink"
        >
          {acties.map((a) => (
            <option key={a.id} value={a.id}>
              {a.naam}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-1.5 text-[11.5px] text-text-muted">
        Klik op de foto om de nieuwe stip neer te zetten.
      </p>

      <div
        onClick={fotoKlik}
        className="relative overflow-hidden rounded-card border border-border-light bg-[#f4f2ec]"
        style={{ cursor: actieId ? "crosshair" : "default" }}
      >
        <img src={fotoUrl} alt="" className="block w-full select-none" draggable={false} />
        {hotspots.map((h) => (
          <span
            key={h.id}
            className="motion absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border-2 border-creme bg-navy/85 py-1 pl-2.5 pr-1 text-[11px] font-extrabold uppercase tracking-[0.04em] text-creme"
            style={{ left: `${h.xPct}%`, top: `${h.yPct}%` }}
          >
            {h.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void verwijder(h.id);
              }}
              disabled={bezig}
              aria-label={`Stip "${h.label}" verwijderen`}
              className="motion flex h-4 w-4 items-center justify-center rounded-full hover:bg-creme/20 disabled:opacity-40"
            >
              <X size={10} strokeWidth={2.8} />
            </button>
          </span>
        ))}
        {nieuwePositie && (
          <span
            className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-accent/60"
            style={{ left: `${nieuwePositie.xPct}%`, top: `${nieuwePositie.yPct}%` }}
          />
        )}
      </div>

      {nieuwePositie && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label op de stip, bv. Rem"
            maxLength={24}
            className="h-9 min-w-0 flex-1 rounded-full border border-border-light bg-creme px-3 text-[12.5px] text-ink"
          />
          <button
            type="button"
            onClick={() => void opslaan()}
            disabled={bezig || !label.trim()}
            className="motion h-9 rounded-full bg-accent px-4 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed disabled:opacity-60"
          >
            Opslaan
          </button>
          <button
            type="button"
            onClick={() => setNieuwePositie(null)}
            className="motion h-9 rounded-full border-[1.5px] border-border-light px-4 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-text-medium"
          >
            Annuleren
          </button>
        </div>
      )}
      {fout && <p className="mt-2 text-[12px] text-red-text">{fout}</p>}
    </div>
  );
}

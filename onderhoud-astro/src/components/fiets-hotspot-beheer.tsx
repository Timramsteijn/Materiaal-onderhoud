import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { actions } from "astro:actions";

import { Label } from "@/components/ui";

type Actie = { id: string; naam: string };
type Hotspot = { id: string; actieId: string; xPct: number; yPct: number; rPct: number };

const STANDAARD_RADIUS = 6;
const MIN_RADIUS = 2;
const MAX_RADIUS = 30;

/**
 * Beheerders zetten hier zelf een gebied op de foto, gekoppeld aan een
 * bestaande actie — geen code-wijziging nodig als er een nieuwe
 * onderhoudsactie bijkomt die ook op de foto moet kunnen. Klikken op de foto
 * plaatst/verplaatst een cirkel; de schuifregelaar past de grootte aan.
 * Getekend als cirkel i.p.v. een losse stip met tekst, zodat 'm over het hele
 * bereik van een onderdeel kan worden gelegd (bv. de hele versnelling).
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
  const [nieuweActieId, setNieuweActieId] = useState(acties[0]?.id ?? "");
  const [bewerk, setBewerk] = useState<{
    id: string | null;
    actieId: string;
    xPct: number;
    yPct: number;
    rPct: number;
  } | null>(null);
  const [aspect, setAspect] = useState(16 / 9);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  function fotoKlik(event: ReactMouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100;
    const yPct = ((event.clientY - rect.top) / rect.height) * 100;
    setFout(null);

    if (bewerk) {
      // Al een cirkel in bewerking: een nieuwe klik verplaatst 'm alleen.
      setBewerk({ ...bewerk, xPct, yPct });
      return;
    }
    if (!nieuweActieId) return;
    setBewerk({ id: null, actieId: nieuweActieId, xPct, yPct, rPct: STANDAARD_RADIUS });
  }

  function hotspotKlik(event: ReactMouseEvent, h: Hotspot) {
    event.stopPropagation();
    setFout(null);
    setBewerk({ id: h.id, actieId: h.actieId, xPct: h.xPct, yPct: h.yPct, rPct: h.rPct });
  }

  async function opslaan() {
    if (!bewerk) return;
    setBezig(true);
    setFout(null);
    const formData = new FormData();
    formData.set("xPct", String(bewerk.xPct));
    formData.set("yPct", String(bewerk.yPct));
    formData.set("rPct", String(bewerk.rPct));
    const { error } = bewerk.id
      ? await (() => {
          formData.set("hotspotId", bewerk.id!);
          return actions.werkFietsHotspotBij(formData);
        })()
      : await (() => {
          formData.set("actieId", bewerk.actieId);
          return actions.voegFietsHotspotToe(formData);
        })();
    setBezig(false);
    if (error) {
      setFout(error.message);
      return;
    }
    window.location.reload();
  }

  async function verwijder() {
    if (!bewerk?.id) return;
    setBezig(true);
    const formData = new FormData();
    formData.set("hotspotId", bewerk.id);
    await actions.verwijderFietsHotspot(formData);
    window.location.reload();
  }

  const bewerkteActie = bewerk ? acties.find((a) => a.id === bewerk.actieId) : undefined;

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-text-muted">
        Plek op de foto
      </p>

      {bewerk ? (
        <p className="mb-1.5 text-[11.5px] text-text-muted">
          Bezig met <strong className="text-ink">{bewerkteActie?.naam}</strong> — klik op de foto
          om te verplaatsen, of pas de grootte aan.
        </p>
      ) : (
        <div className="mb-2">
          <Label htmlFor="hotspot-actie">Nieuwe cirkel voor</Label>
          <select
            id="hotspot-actie"
            value={nieuweActieId}
            onChange={(e) => setNieuweActieId(e.target.value)}
            className="h-9 w-full rounded-input border border-border-light bg-creme px-2.5 text-[12.5px] text-ink"
          >
            {acties.map((a) => (
              <option key={a.id} value={a.id}>
                {a.naam}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11.5px] text-text-muted">
            Klik op de foto om de cirkel neer te zetten. Een bestaande cirkel aanklikken past 'm
            aan.
          </p>
        </div>
      )}

      <div
        onClick={fotoKlik}
        className="relative overflow-hidden rounded-card border border-border-light bg-[#f4f2ec]"
        style={{ cursor: "crosshair" }}
      >
        <img
          src={fotoUrl}
          alt=""
          className="block w-full select-none"
          draggable={false}
          onLoad={(e) => setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
        />
        {hotspots
          .filter((h) => h.id !== bewerk?.id)
          .map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={(e) => hotspotKlik(e, h)}
              aria-label={`${acties.find((a) => a.id === h.actieId)?.naam ?? ""} aanpassen`}
              className="motion absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/70 bg-accent/10 hover:bg-accent/25"
              style={{
                left: `${h.xPct}%`,
                top: `${h.yPct}%`,
                width: `${h.rPct * 2}%`,
                height: `${h.rPct * 2 * aspect}%`,
              }}
            />
          ))}
        {bewerk && (
          <span
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-ink bg-ink/15"
            style={{
              left: `${bewerk.xPct}%`,
              top: `${bewerk.yPct}%`,
              width: `${bewerk.rPct * 2}%`,
              height: `${bewerk.rPct * 2 * aspect}%`,
            }}
          />
        )}
      </div>

      {bewerk && (
        <div className="mt-2.5">
          <div className="flex items-center gap-2.5">
            <Label htmlFor="hotspot-straal">Grootte</Label>
            <input
              id="hotspot-straal"
              type="range"
              min={MIN_RADIUS}
              max={MAX_RADIUS}
              step={0.5}
              value={bewerk.rPct}
              onChange={(e) => setBewerk({ ...bewerk, rPct: Number(e.target.value) })}
              className="h-9 min-w-0 flex-1"
            />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void opslaan()}
              disabled={bezig}
              className="motion h-9 rounded-full bg-accent px-4 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed disabled:opacity-60"
            >
              Opslaan
            </button>
            <button
              type="button"
              onClick={() => setBewerk(null)}
              disabled={bezig}
              className="motion h-9 rounded-full border-[1.5px] border-border-light px-4 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-text-medium disabled:opacity-60"
            >
              Annuleren
            </button>
            {bewerk.id && (
              <button
                type="button"
                onClick={() => void verwijder()}
                disabled={bezig}
                className="motion h-9 rounded-full border-[1.5px] border-red-text px-4 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-red-text hover:bg-red-tint disabled:opacity-60"
              >
                Verwijderen
              </button>
            )}
          </div>
        </div>
      )}
      {fout && <p className="mt-2 text-[12px] text-red-text">{fout}</p>}
    </div>
  );
}

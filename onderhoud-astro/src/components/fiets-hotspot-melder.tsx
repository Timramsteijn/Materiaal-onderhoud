export type Hotspot = { id: string; actieId: string; label: string; xPct: number; yPct: number };

/**
 * Visuele manier om te melden voor wie de onderdeelnamen niet kent: in
 * plaats van te kiezen uit een lijst met actienamen, klik je op de foto op
 * het onderdeel dat het probleem heeft. De stippen komen uit de database
 * (zie fiets-hotspot-beheer.tsx) — een beheerder zet ze zelf neer bij Beheer,
 * dus hier is geen hardcoded lijst meer nodig. De volledige actielijst
 * eronder blijft gewoon bestaan — dit is een extra ingang, geen vervanging.
 */
export function FietsHotspotMelder({
  fotoUrl,
  hotspots,
  geselecteerdActieId,
  onKies,
}: {
  fotoUrl: string;
  hotspots: Hotspot[];
  geselecteerdActieId: string;
  onKies: (actieId: string) => void;
}) {
  if (hotspots.length === 0) return null;

  return (
    <div className="relative mt-1 overflow-hidden rounded-card border border-border-light bg-[#f4f2ec]">
      <img
        src={fotoUrl}
        alt="Foto met aanklikbare onderdelen"
        className="block w-full select-none"
        draggable={false}
      />
      {hotspots.map((h) => {
        const actief = geselecteerdActieId === h.actieId;
        return (
          <button
            key={h.id}
            type="button"
            onClick={() => onKies(h.actieId)}
            aria-pressed={actief}
            className={`motion absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.04em] shadow-[var(--shadow-light)] ${
              actief
                ? "border-accent bg-accent text-accent-on"
                : "border-creme bg-navy/85 text-creme hover:bg-navy"
            }`}
            style={{ left: `${h.xPct}%`, top: `${h.yPct}%` }}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            {h.label}
          </button>
        );
      })}
    </div>
  );
}

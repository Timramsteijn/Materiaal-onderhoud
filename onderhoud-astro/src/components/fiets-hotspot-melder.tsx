type Actie = { id: string; naam: string };

/**
 * Plek op de foto → bestaande actienaam uit de categorie (zie seed-data.mjs,
 * categorieën "MTB"/"E-MTB"). Percentages t.o.v. de natuurlijke afmeting van
 * de foto, zodat de stip meeschaalt ongeacht de weergavebreedte. Bepaald door
 * de aangeleverde fietsfoto in vaste stappen uit te snijden en per onderdeel
 * de pixelpositie af te lezen.
 */
const HOTSPOTS: { actieNaam: string; label: string; xPct: number; yPct: number }[] = [
  { actieNaam: "Remmen controleren", label: "Rem", xPct: 80, yPct: 62.4 },
  { actieNaam: "Derailleur stellen", label: "Versnelling", xPct: 21, yPct: 65 },
  { actieNaam: "Ketting reinigen", label: "Ketting", xPct: 35, yPct: 72.8 },
  { actieNaam: "Wielen centreren", label: "Wiel", xPct: 86, yPct: 43.3 },
  { actieNaam: "Bandenspanning", label: "Band", xPct: 14, yPct: 89.3 },
];

/**
 * Visuele manier om te melden voor wie de onderdeelnamen niet kent: in
 * plaats van te kiezen uit een lijst met actienamen, klik je op de foto op
 * het onderdeel dat het probleem heeft. Alleen onderdelen die ook echt in de
 * actielijst van deze categorie staan krijgen een stip (zo blijft dit werken
 * als acties ooit wijzigen, zonder hardcoded uitzonderingen per categorie).
 * De volledige lijst eronder blijft gewoon bestaan — dit is een extra
 * ingang, geen vervanging.
 */
export function FietsHotspotMelder({
  acties,
  geselecteerdActieId,
  onKies,
}: {
  acties: Actie[];
  geselecteerdActieId: string;
  onKies: (actieId: string) => void;
}) {
  const stippen = HOTSPOTS.map((h) => ({ ...h, actie: acties.find((a) => a.naam === h.actieNaam) })).filter(
    (h): h is (typeof HOTSPOTS)[number] & { actie: Actie } => Boolean(h.actie)
  );

  if (stippen.length === 0) return null;

  return (
    <div className="relative mt-1 overflow-hidden rounded-card border border-border-light bg-[#f4f2ec]">
      <img
        src="/mountainbike-onderdelen.webp"
        alt="Zijaanzicht van de mountainbike, met aanklikbare onderdelen"
        className="block w-full select-none"
        draggable={false}
      />
      {stippen.map((h) => {
        const actief = geselecteerdActieId === h.actie.id;
        return (
          <button
            key={h.actieNaam}
            type="button"
            onClick={() => onKies(h.actie.id)}
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

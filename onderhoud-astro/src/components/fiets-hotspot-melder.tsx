import { useState } from "react";

type Actie = { id: string; naam: string };
export type Hotspot = { id: string; actieId: string; xPct: number; yPct: number; rPct: number };

/**
 * Visuele manier om te melden voor wie de onderdeelnamen niet kent: in
 * plaats van te kiezen uit een lijst met actienamen, klik je op de foto op
 * het onderdeel dat het probleem heeft. De cirkels komen uit de database
 * (zie fiets-hotspot-beheer.tsx) — een beheerder zet ze zelf neer en past de
 * grootte aan bij Beheer, dus hier is geen hardcoded lijst meer nodig. Geen
 * zichtbare tekst op de cirkel zelf: de naam van de gekoppelde actie is het
 * toegankelijkheidslabel. De volledige actielijst eronder blijft gewoon
 * bestaan — dit is een extra ingang, geen vervanging.
 */
export function FietsHotspotMelder({
  fotoUrl,
  hotspots,
  acties,
  geselecteerdActieId,
  onKies,
}: {
  fotoUrl: string;
  hotspots: Hotspot[];
  acties: Actie[];
  geselecteerdActieId: string;
  onKies: (actieId: string) => void;
}) {
  // Natuurlijke beeldverhouding van de foto, zodat een cirkel een cirkel
  // blijft ongeacht de weergavebreedte (zie fiets-hotspot-beheer.tsx voor
  // dezelfde berekening, met uitleg).
  const [aspect, setAspect] = useState(16 / 9);

  if (hotspots.length === 0) return null;

  return (
    <div className="relative mt-1 overflow-hidden rounded-card border border-border-light bg-[#f4f2ec]">
      <img
        src={fotoUrl}
        alt="Foto met aanklikbare onderdelen"
        className="block w-full select-none"
        draggable={false}
        onLoad={(e) => setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
      />
      {hotspots.map((h) => {
        const actief = geselecteerdActieId === h.actieId;
        const actieNaam = acties.find((a) => a.id === h.actieId)?.naam ?? "";
        return (
          <button
            key={h.id}
            type="button"
            onClick={() => onKies(h.actieId)}
            aria-pressed={actief}
            aria-label={actieNaam}
            className={`motion absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
              actief ? "border-accent bg-accent/35" : "border-accent/70 bg-accent/10 hover:bg-accent/20"
            }`}
            style={{
              left: `${h.xPct}%`,
              top: `${h.yPct}%`,
              width: `${h.rPct * 2}%`,
              height: `${h.rPct * 2 * aspect}%`,
            }}
          />
        );
      })}
    </div>
  );
}

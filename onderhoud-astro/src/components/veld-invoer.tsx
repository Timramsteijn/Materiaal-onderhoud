import { Label, inputClass } from "@/components/ui";
import type { VeldType } from "@/db/schema";

export type VeldInvoerDefinitie = {
  id: string;
  naam: string;
  type: VeldType;
  eenheid: string | null;
  /** JSON-array met keuzes; alleen gevuld bij type KEUZE. */
  opties: string[];
};

/**
 * Eén categorie-eigen veld. Zowel het aanmaak- als het bewerkformulier gebruikt
 * dit, zodat je bij het toevoegen dezelfde gegevens kwijt kunt als achteraf.
 *
 * De naam is altijd `veld:{id}`; daar leest de action ze op terug.
 */
export function VeldInvoer({
  veld,
  waarde = "",
  idVoorvoegsel = "veld",
}: {
  veld: VeldInvoerDefinitie;
  waarde?: string;
  /** Houdt de id's uniek als een veld twee keer op de pagina staat. */
  idVoorvoegsel?: string;
}) {
  const veldId = `${idVoorvoegsel}-${veld.id}`;
  const label = veld.eenheid ? `${veld.naam} (${veld.eenheid})` : veld.naam;

  if (veld.type === "KEUZE" && veld.opties.length > 0) {
    return (
      <div>
        <Label htmlFor={veldId}>{label}</Label>
        <select id={veldId} name={`veld:${veld.id}`} defaultValue={waarde} className={inputClass}>
          <option value="">—</option>
          {veld.opties.map((optie) => (
            <option key={optie} value={optie}>
              {optie}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // BEREIK blijft tekst: "3 – 10" is geen getal. GETAL krijgt een numeriek
  // toetsenbord op mobiel, DATUM de datumkiezer van de browser.
  const type = veld.type === "GETAL" ? "number" : veld.type === "DATUM" ? "date" : "text";

  return (
    <div>
      <Label htmlFor={veldId}>{label}</Label>
      <input
        id={veldId}
        name={`veld:${veld.id}`}
        type={type}
        {...(veld.type === "GETAL" ? { step: "any", inputMode: "decimal" as const } : {})}
        defaultValue={waarde}
        placeholder={veld.type === "BEREIK" ? "bv. 3 – 10" : undefined}
        className={inputClass}
      />
    </div>
  );
}

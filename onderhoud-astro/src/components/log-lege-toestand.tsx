import { ClipboardList } from "@/components/icons";
import { LegeToestand, OutlineKnop } from "@/components/ui";

/**
 * Losgetrokken van log.astro: JSX die als prop aan een ander React-component
 * wordt doorgegeven, geschreven rechtstreeks in een .astro-bestand, compileert
 * niet naar een echt React-element (Astro's eigen templatesyntax levert dan
 * zijn interne renderresultaat af in plaats van een React-node). Hier, in een
 * echt .tsx-bestand, is het gewoon reguliere React-compositie.
 */
export function LogLegeToestand({
  onderdeelNaam,
  heeftFilter,
  basis,
}: {
  onderdeelNaam: string;
  heeftFilter: boolean;
  basis: string;
}) {
  return (
    <LegeToestand
      icoon={<ClipboardList size={26} strokeWidth={2} />}
      kop="Geen registraties gevonden"
      uitleg={`Er zijn geen registraties in ${onderdeelNaam} die aan deze filters voldoen.`}
      acties={heeftFilter ? <OutlineKnop href={basis}>Filter wissen</OutlineKnop> : undefined}
    />
  );
}

import { Search, Plus } from "@/components/icons";
import { LegeToestand, OutlineKnop } from "@/components/ui";
import { AANDACHT_NODIG_MAANDEN } from "@/lib/domein";

/**
 * Losgetrokken van MateriaalLijst.astro: zie log-lege-toestand.tsx voor de
 * reden (JSX-als-prop werkt niet vanuit .astro-templatesyntax).
 */
export function MateriaalLegeToestand({
  onderdeelNaam,
  categorieNaam,
  filters,
  basis,
  nieuwKop,
}: {
  onderdeelNaam: string;
  categorieNaam?: string;
  filters: { q?: string; categorie?: string; aandacht?: boolean; gemeld?: boolean };
  basis: string;
  nieuwKop?: string | null;
}) {
  const binnen = categorieNaam ? ` binnen ${categorieNaam}` : "";
  const uitleg = filters.gemeld
    ? `Er staat geen onderhoud open in ${onderdeelNaam}${binnen}.`
    : filters.aandacht
      ? `Al het materiaal in ${onderdeelNaam}${binnen} is binnen ${AANDACHT_NODIG_MAANDEN} maanden onderhouden.`
      : filters.q
        ? `Geen materiaal in ${onderdeelNaam} dat overeenkomt met "${filters.q}"${binnen}.`
        : `Er staat nog geen materiaal in ${onderdeelNaam}${binnen}.`;
  const heeftFilter = Boolean(filters.q || filters.categorie || filters.aandacht || filters.gemeld);

  return (
    <LegeToestand
      icoon={<Search size={26} strokeWidth={2} />}
      kop="Geen materiaal gevonden"
      uitleg={uitleg}
      acties={
        <>
          {heeftFilter && <OutlineKnop href={basis}>Filter wissen</OutlineKnop>}
          <a
            href={`${basis}/nieuw`}
            aria-label={nieuwKop ?? "Nieuw materiaal"}
            className="motion lift flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed"
          >
            <Plus size={16} strokeWidth={2} />
            Nieuw
          </a>
        </>
      }
    />
  );
}

import { STATUS_KEUZES, STATUS_LABELS } from "@/lib/domein";
import { ChevronDown } from "@/components/icons";

type Optie = { waarde: string; label: string };

/**
 * Vier filters als pills met een keuzelijst. Bewust een echte <select>: dat is
 * op de werkvloer met handschoenen én met het toetsenbord het betrouwbaarst.
 * Geen datumfilter — dat is een bewuste keuze in het ontwerp.
 *
 * Alles staat in één GET-formulier, dus de filters werken ook zonder
 * JavaScript; met JavaScript verstuurt een keuze meteen.
 */
export function LogFilters({
  pad,
  query,
  categorieen,
  acties,
  medewerkers,
}: {
  pad: string;
  /** De huidige querystring, zonder vraagteken. */
  query: string;
  categorieen: { id: string; naam: string }[];
  acties: string[];
  medewerkers: string[];
}) {
  const params = new URLSearchParams(query);
  // Zoekterm en materiaalfilter horen bij het zoekveld, niet bij deze pills.
  const behouden = ["q", "materiaal"].filter((naam) => params.get(naam));

  return (
    <form method="get" action={pad} className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto">
      {behouden.map((naam) => (
        <input key={naam} type="hidden" name={naam} value={params.get(naam)!} />
      ))}

      <Filter
        label="Categorie"
        sleutel="categorie"
        waarde={params.get("categorie") ?? ""}
        opties={categorieen.map((c) => ({ waarde: c.id, label: c.naam }))}
      />
      <Filter
        label="Actie"
        sleutel="actie"
        waarde={params.get("actie") ?? ""}
        opties={acties.map((a) => ({ waarde: a, label: a }))}
      />
      <Filter
        label="Medewerker"
        sleutel="medewerker"
        waarde={params.get("medewerker") ?? ""}
        opties={medewerkers.map((m) => ({ waarde: m, label: m }))}
      />
      <Filter
        label="Status na actie"
        sleutel="status"
        waarde={params.get("status") ?? ""}
        opties={STATUS_KEUZES.map((s) => ({ waarde: s, label: STATUS_LABELS[s] }))}
      />

      <button
        type="submit"
        className="motion h-10 shrink-0 rounded-full border-[1.5px] border-border-light bg-creme px-3.5 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-text-medium hover:border-accent"
      >
        Filteren
      </button>
    </form>
  );
}

function Filter({
  label,
  sleutel,
  waarde,
  opties,
}: {
  label: string;
  sleutel: string;
  waarde: string;
  opties: Optie[];
}) {
  const actief = Boolean(waarde);

  return (
    <div className="relative shrink-0">
      <select
        name={sleutel}
        aria-label={label}
        defaultValue={waarde}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`motion h-10 appearance-none rounded-full border-[1.5px] py-0 pl-3.5 pr-8 text-[11.5px] font-extrabold uppercase tracking-[0.08em] ${
          actief
            ? "border-ink bg-ink text-accent"
            : "border-border-light bg-creme text-text-medium hover:border-accent"
        }`}
      >
        <option value="">{label}</option>
        {opties.map((o) => (
          <option key={o.waarde} value={o.waarde}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={2.4}
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
          actief ? "text-accent" : "text-text-muted"
        }`}
      />
    </div>
  );
}

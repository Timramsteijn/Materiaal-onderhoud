"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { STATUS_KEUZES, STATUS_LABELS } from "@/lib/domain";
import { ChevronDown } from "@/components/icons";

type Optie = { waarde: string; label: string };

/**
 * Vier filters als pills met een keuzelijst. Bewust een echte <select>: dat is
 * op de werkvloer met handschoenen én met het toetsenbord het betrouwbaarst.
 * Geen datumfilter — dat is een bewuste keuze in het ontwerp.
 */
export function LogFilters({
  categorieen,
  acties,
  medewerkers,
}: {
  categorieen: { id: string; naam: string }[];
  acties: string[];
  medewerkers: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function zet(sleutel: string, waarde: string) {
    const params = new URLSearchParams(searchParams);
    if (waarde) params.set(sleutel, waarde);
    else params.delete(sleutel);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto">
      <Filter
        label="Categorie"
        sleutel="categorie"
        waarde={searchParams.get("categorie") ?? ""}
        opties={categorieen.map((c) => ({ waarde: c.id, label: c.naam }))}
        onKies={zet}
      />
      <Filter
        label="Actie"
        sleutel="actie"
        waarde={searchParams.get("actie") ?? ""}
        opties={acties.map((a) => ({ waarde: a, label: a }))}
        onKies={zet}
      />
      <Filter
        label="Medewerker"
        sleutel="medewerker"
        waarde={searchParams.get("medewerker") ?? ""}
        opties={medewerkers.map((m) => ({ waarde: m, label: m }))}
        onKies={zet}
      />
      <Filter
        label="Status na actie"
        sleutel="status"
        waarde={searchParams.get("status") ?? ""}
        opties={STATUS_KEUZES.map((s) => ({ waarde: s, label: STATUS_LABELS[s] }))}
        onKies={zet}
      />
    </div>
  );
}

function Filter({
  label,
  sleutel,
  waarde,
  opties,
  onKies,
}: {
  label: string;
  sleutel: string;
  waarde: string;
  opties: Optie[];
  onKies: (sleutel: string, waarde: string) => void;
}) {
  const actief = Boolean(waarde);
  const gekozen = opties.find((o) => o.waarde === waarde);

  return (
    <div className="relative shrink-0">
      <select
        aria-label={label}
        value={waarde}
        onChange={(e) => onKies(sleutel, e.target.value)}
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
      <span className="sr-only">{gekozen ? `${label}: ${gekozen.label}` : label}</span>
    </div>
  );
}

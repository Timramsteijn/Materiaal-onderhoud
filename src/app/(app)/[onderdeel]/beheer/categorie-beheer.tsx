"use client";

import { useActionState, useState, useTransition } from "react";
import {
  voegActieToe,
  voegVeldToe,
  voegCategorieToe,
  archiveerActie,
  archiveerVeld,
  archiveerCategorie,
  type BeheerState,
} from "@/lib/actions/beheer";
import { BevestigModal } from "@/components/bevestig-modal";
import { ChevronDown, Plus, X } from "@/components/icons";

type Actie = { id: string; naam: string; isAfkeuren: boolean };
type Veld = { id: string; naam: string; eenheid: string | null };
type Categorie = { id: string; naam: string; aantal: number; acties: Actie[]; velden: Veld[] };

type TeArchiveren =
  | { soort: "actie"; id: string; naam: string; categorie: string }
  | { soort: "veld"; id: string; naam: string; categorie: string }
  | { soort: "categorie"; id: string; naam: string; categorie: string };

export function CategorieBeheer({
  onderdeelId,
  categorieen,
  medewerkerNaam,
}: {
  onderdeelId: string;
  categorieen: Categorie[];
  medewerkerNaam: string;
}) {
  // Eén categorie tegelijk open; de eerste staat standaard open.
  const [open, setOpen] = useState<string | null>(categorieen[0]?.id ?? null);
  const [teArchiveren, setTeArchiveren] = useState<TeArchiveren | null>(null);
  const [bezig, start] = useTransition();
  const [nieuweCategorie, setNieuweCategorie] = useState(false);
  const [catState, catAction, catPending] = useActionState<BeheerState, FormData>(
    voegCategorieToe,
    undefined
  );

  function bevestig() {
    if (!teArchiveren) return;
    const { soort, id } = teArchiveren;
    start(async () => {
      if (soort === "actie") await archiveerActie(id);
      else if (soort === "veld") await archiveerVeld(id);
      else await archiveerCategorie(id);
      setTeArchiveren(null);
    });
  }

  return (
    <div>
      <ul className="divide-y divide-zand border-t border-zand">
        {categorieen.map((c) => {
          const uitgeklapt = open === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setOpen(uitgeklapt ? null : c.id)}
                aria-expanded={uitgeklapt}
                className="motion flex w-full items-center gap-3 py-3 text-left"
              >
                <span className="flex-1 text-[15px] font-extrabold text-ink">{c.naam}</span>
                <span className="text-[12px] text-text-muted">{c.aantal} stuks</span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.2}
                  className={`motion text-text-muted ${uitgeklapt ? "rotate-180" : ""}`}
                />
              </button>

              {uitgeklapt && (
                <div className="pb-4">
                  <ChipBlok
                    titel="Onderhoudsacties"
                    chips={c.acties.map((a) => ({ id: a.id, label: a.naam }))}
                    stijl="neutraal"
                    onVerwijder={(id, naam) =>
                      setTeArchiveren({ soort: "actie", id, naam, categorie: c.naam })
                    }
                    toevoegVeld={
                      <ToevoegForm
                        actie={voegActieToe}
                        verborgen={{ categorieId: c.id }}
                        placeholder="Nieuwe actie"
                      />
                    }
                  />

                  <ChipBlok
                    titel="Eigen velden"
                    chips={c.velden.map((v) => ({
                      id: v.id,
                      label: v.eenheid ? `${v.naam} (${v.eenheid})` : v.naam,
                    }))}
                    stijl="accent"
                    onVerwijder={(id, naam) =>
                      setTeArchiveren({ soort: "veld", id, naam, categorie: c.naam })
                    }
                    toevoegVeld={
                      <ToevoegForm
                        actie={voegVeldToe}
                        verborgen={{ categorieId: c.id }}
                        placeholder="Nieuw veld"
                        metEenheid
                      />
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setTeArchiveren({ soort: "categorie", id: c.id, naam: c.naam, categorie: c.naam })
                    }
                    className="motion mt-3 text-[11.5px] font-bold uppercase tracking-[0.08em] text-red-text hover:underline"
                  >
                    Categorie verwijderen
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {nieuweCategorie ? (
        <form action={catAction} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="onderdeelId" value={onderdeelId} />
          <input
            name="naam"
            required
            autoFocus
            placeholder="Naam van de categorie"
            className="h-10 min-w-0 flex-1 rounded-input border border-border-light bg-creme px-3 text-[13.5px] text-ink"
          />
          <button
            type="submit"
            disabled={catPending}
            className="motion h-10 rounded-full bg-accent px-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed disabled:opacity-60"
          >
            Opslaan
          </button>
          <button
            type="button"
            onClick={() => setNieuweCategorie(false)}
            className="motion h-10 rounded-full border-[1.5px] border-border-light px-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-text-medium"
          >
            Annuleren
          </button>
          {catState?.fout && (
            <p className="w-full text-[12.5px] text-red-text">{catState.fout}</p>
          )}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setNieuweCategorie(true)}
          className="motion mt-3 flex items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-link px-3 py-2 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-link hover:bg-accent-tint"
        >
          <Plus size={14} strokeWidth={2.4} />
          Categorie toevoegen
        </button>
      )}

      {teArchiveren && (
        <BevestigModal
          vraag={`'${teArchiveren.naam}' verwijderen uit ${teArchiveren.categorie}?`}
          gevolgen="De bestaande registraties blijven in het onderhoudslog staan en worden niet gewijzigd."
          medewerkerNaam={medewerkerNaam}
          bezig={bezig}
          onAnnuleer={() => setTeArchiveren(null)}
          onBevestig={bevestig}
        />
      )}
    </div>
  );
}

function ChipBlok({
  titel,
  chips,
  stijl,
  onVerwijder,
  toevoegVeld,
}: {
  titel: string;
  chips: { id: string; label: string }[];
  stijl: "neutraal" | "accent";
  onVerwijder: (id: string, naam: string) => void;
  toevoegVeld: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-text-muted">
        {titel}
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip.id}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] ${
              stijl === "accent"
                ? "border-accent-tint bg-accent-tint text-accent-ink"
                : "border-border-light bg-zand text-ink"
            }`}
          >
            {chip.label}
            <button
              type="button"
              onClick={() => onVerwijder(chip.id, chip.label)}
              aria-label={`${chip.label} verwijderen`}
              className="motion text-red-text hover:opacity-70"
            >
              <X size={12} strokeWidth={2.6} />
            </button>
          </span>
        ))}
        {chips.length === 0 && <span className="text-[12.5px] text-text-muted">Nog niets.</span>}
      </div>
      <div className="mt-2">{toevoegVeld}</div>
    </div>
  );
}

function ToevoegForm({
  actie,
  verborgen,
  placeholder,
  metEenheid,
}: {
  actie: (prev: BeheerState, formData: FormData) => Promise<BeheerState>;
  verborgen: Record<string, string>;
  placeholder: string;
  metEenheid?: boolean;
}) {
  const [state, formAction, pending] = useActionState<BeheerState, FormData>(actie, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      {Object.entries(verborgen).map(([naam, waarde]) => (
        <input key={naam} type="hidden" name={naam} value={waarde} />
      ))}
      <input
        name="naam"
        required
        placeholder={placeholder}
        className="h-9 min-w-[140px] flex-1 rounded-full border border-border-light bg-creme px-3 text-[12.5px] text-ink"
      />
      {metEenheid && (
        <input
          name="eenheid"
          placeholder="eenheid"
          className="h-9 w-[86px] rounded-full border border-border-light bg-creme px-3 text-[12.5px] text-ink"
        />
      )}
      <button
        type="submit"
        disabled={pending}
        className="motion flex h-9 items-center gap-1 rounded-full border-[1.5px] border-dashed border-link px-3 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-link hover:bg-accent-tint disabled:opacity-60"
      >
        <Plus size={13} strokeWidth={2.4} />
        toevoegen
      </button>
      {state?.fout && <p className="w-full text-[12px] text-red-text">{state.fout}</p>}
    </form>
  );
}

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type SubmitEvent as ReactSubmitEvent,
} from "react";
import { actions } from "astro:actions";

import { Kaart, KaartTitel, Label, inputClass } from "@/components/ui";
import { ChevronRight, Plus, X } from "@/components/icons";
import { BAANSCHETS_LEGENDA } from "@/lib/domein";
import { accentOn } from "@/lib/accent";
import type { BaanschetsCategorie } from "@/db/schema";

const CELSIZE = 26;
const ZOOMSTAPPEN = [0.6, 0.85, 1, 1.3, 1.7];

export type Cel = {
  rij: number;
  kolom: number;
  categorie: BaanschetsCategorie;
  leeftijd: number | null;
  opmerking: string;
  gemarkeerd: boolean;
};

export type SectieMetPosities = {
  id: string;
  nr: number;
  omschrijving: string;
  /** "{rij}_{kolom}" voor elke cel die bij deze sectie hoort. */
  posities: string[];
  bereiken: { id: string; rijVan: number; rijTot: number; kolomVan: number; kolomTot: number }[];
  /** Server-side al geteld (telPerCategorie), net als de kaart erboven. */
  totalen: Record<BaanschetsCategorie, number>;
  totaalAantal: number;
  totaalM2: number;
};

const KORTE_LABELS: Record<BaanschetsCategorie, string> = {
  SkiLicht: "SkiL",
  SkiMidden: "SkiM",
  SkiDonker: "SkiD",
  LiftLicht: "LiftL",
  LiftDonker: "LiftD",
  Rubber: "Rub",
};

/**
 * De baanschets: canvas-rooster (niet 1125+ losse DOM-knoppen — dat wordt
 * traag op mobiel) met hover-tooltip, leeftijd-toggle, klik-om-te-bewerken en
 * een secties-tabel die het rooster hierboven highlight. Eén component omdat
 * "klik op een sectie highlight 'm in het rooster" state tussen de twee moet
 * delen; apart opsplitsen zou alleen een omweg via window-events toevoegen.
 */
export function BaanschetsGrid({
  aantalRijen,
  aantalKolommen,
  cellen,
  secties,
  basisleeftijdSeizoenen,
  magBewerken,
  bewerkUrl,
  sectieToevoegenUrl,
  bereikToevoegenUrl,
  bereikVerwijderenUrl,
}: {
  aantalRijen: number;
  aantalKolommen: number;
  cellen: Cel[];
  secties: SectieMetPosities[];
  basisleeftijdSeizoenen: number;
  magBewerken: boolean;
  /** URL's van de Astro Actions; ook het doel als JavaScript uitstaat. */
  bewerkUrl: string;
  sectieToevoegenUrl: string;
  bereikToevoegenUrl: string;
  bereikVerwijderenUrl: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [toonLeeftijd, setToonLeeftijd] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(2);
  const zoom = ZOOMSTAPPEN[zoomIndex];
  const [gehoverd, setGehoverd] = useState<{ rij: number; kolom: number; x: number; y: number } | null>(
    null
  );
  const [geselecteerd, setGeselecteerd] = useState<{ rij: number; kolom: number } | null>(null);
  const [actieveSectieId, setActieveSectieId] = useState<string | null>(null);

  const celMap = useMemo(() => {
    const map = new Map<string, Cel>();
    for (const c of cellen) map.set(`${c.rij}_${c.kolom}`, c);
    return map;
  }, [cellen]);

  const actieveSectie = secties.find((s) => s.id === actieveSectieId);
  const highlightSet = useMemo(
    () => (actieveSectie ? new Set(actieveSectie.posities) : null),
    [actieveSectie]
  );

  const teken = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const breedte = aantalKolommen * CELSIZE * zoom;
    const hoogte = aantalRijen * CELSIZE * zoom;
    canvas.width = breedte * dpr;
    canvas.height = hoogte * dpr;
    canvas.style.width = `${breedte}px`;
    canvas.style.height = `${hoogte}px`;
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
    ctx.clearRect(0, 0, aantalKolommen * CELSIZE, aantalRijen * CELSIZE);

    for (let rij = 1; rij <= aantalRijen; rij++) {
      for (let kolom = 1; kolom <= aantalKolommen; kolom++) {
        const sleutel = `${rij}_${kolom}`;
        const cel = celMap.get(sleutel);
        const x = (kolom - 1) * CELSIZE;
        const y = (rij - 1) * CELSIZE;

        if (cel) {
          ctx.fillStyle = BAANSCHETS_LEGENDA[cel.categorie].kleur;
          ctx.fillRect(x, y, CELSIZE, CELSIZE);
        }

        // Rooster altijd zichtbaar, ook op lege plekken — scheelt een rand
        // per los vakje en toont meteen de vorm van de baan.
        ctx.strokeStyle = "rgba(21,33,43,0.12)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, CELSIZE - 1, CELSIZE - 1);

        if (highlightSet?.has(sleutel)) {
          ctx.strokeStyle = "#1f5fd0";
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, CELSIZE - 2, CELSIZE - 2);
        }

        if (cel?.gemarkeerd) {
          ctx.strokeStyle = "#ed7d31";
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x + 1.5, y + 1.5, CELSIZE - 3, CELSIZE - 3);
        }

        if (cel && toonLeeftijd) {
          const leeftijd = cel.leeftijd ?? basisleeftijdSeizoenen;
          ctx.fillStyle = accentOn(BAANSCHETS_LEGENDA[cel.categorie].kleur);
          ctx.font = "bold 11px Figtree, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(leeftijd), x + CELSIZE / 2, y + CELSIZE / 2);
        }
      }
    }
  }, [aantalRijen, aantalKolommen, celMap, highlightSet, toonLeeftijd, basisleeftijdSeizoenen, zoom]);

  useEffect(teken, [teken]);

  function celOpPunt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    // CSS-pixels per cel, rechtstreeks uit de gerenderde (dus al gezoomde)
    // afmeting — zo hoeft hier nergens los met zoom of CELSIZE gerekend te
    // worden, dat scheelt een eenhedenfout.
    const kolom = Math.floor((clientX - rect.left) / (rect.width / aantalKolommen)) + 1;
    const rij = Math.floor((clientY - rect.top) / (rect.height / aantalRijen)) + 1;
    if (rij < 1 || rij > aantalRijen || kolom < 1 || kolom > aantalKolommen) return null;
    return { rij, kolom };
  }

  function opBeweging(event: ReactMouseEvent<HTMLCanvasElement>) {
    const positie = celOpPunt(event.clientX, event.clientY);
    if (!positie) {
      setGehoverd(null);
      return;
    }
    setGehoverd({ ...positie, x: event.clientX, y: event.clientY });
  }

  function opKlik(event: ReactMouseEvent<HTMLCanvasElement>) {
    const positie = celOpPunt(event.clientX, event.clientY);
    if (!positie) return;
    const cel = celMap.get(`${positie.rij}_${positie.kolom}`);
    if (!magBewerken && !cel) return; // niets te tonen op een lege plek
    setGeselecteerd(positie);
  }

  const gehoverdeCel = gehoverd ? celMap.get(`${gehoverd.rij}_${gehoverd.kolom}`) : null;

  return (
    <Kaart>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <KaartTitel>De baan</KaartTitel>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setToonLeeftijd((v) => !v)}
            className={`motion rounded-full border-[1.5px] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] ${
              toonLeeftijd
                ? "border-ink bg-ink text-accent"
                : "border-border-light bg-creme text-text-medium hover:border-accent"
            }`}
          >
            Leeftijden
          </button>
          <div className="flex items-center overflow-hidden rounded-full border-[1.5px] border-border-light">
            <button
              type="button"
              aria-label="Uitzoomen"
              disabled={zoomIndex === 0}
              onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
              className="flex h-8 w-8 items-center justify-center text-ink disabled:opacity-30"
            >
              −
            </button>
            <span className="w-10 text-center text-[11px] text-text-muted">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              aria-label="Inzoomen"
              disabled={zoomIndex === ZOOMSTAPPEN.length - 1}
              onClick={() => setZoomIndex((i) => Math.min(ZOOMSTAPPEN.length - 1, i + 1))}
              className="flex h-8 w-8 items-center justify-center text-ink disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* overflow-auto geeft natuurlijk pan (slepen/vegen) op mobiel en tablet. */}
      <div className="relative mt-3 max-h-[70vh] overflow-auto overscroll-contain rounded-input border border-border-light bg-zand">
        <canvas
          ref={canvasRef}
          onMouseMove={opBeweging}
          onMouseLeave={() => setGehoverd(null)}
          onClick={opKlik}
          className={magBewerken ? "cursor-pointer" : gehoverdeCel ? "cursor-help" : ""}
        />
      </div>

      {gehoverdeCel && !geselecteerd && (
        <div
          className="pointer-events-none fixed z-30 max-w-[240px] rounded-input bg-navy px-3 py-2 text-[12px] text-creme shadow-[var(--shadow-hover)]"
          style={{ left: gehoverd!.x + 14, top: gehoverd!.y + 14 }}
        >
          <p className="font-bold">
            {BAANSCHETS_LEGENDA[gehoverdeCel.categorie].label} · {gehoverd!.rij}/{gehoverd!.kolom}
          </p>
          <p className="text-text-on-dark">
            Leeftijd: {gehoverdeCel.leeftijd ?? basisleeftijdSeizoenen} seizoenen
          </p>
          {gehoverdeCel.gemarkeerd && (
            <p className="mt-0.5 font-bold text-[#f3a56b]">Fysiek geroteerd</p>
          )}
          {gehoverdeCel.opmerking && <p className="mt-0.5 italic">&ldquo;{gehoverdeCel.opmerking}&rdquo;</p>}
        </div>
      )}

      {geselecteerd && (
        <CelPopover
          rij={geselecteerd.rij}
          kolom={geselecteerd.kolom}
          cel={celMap.get(`${geselecteerd.rij}_${geselecteerd.kolom}`) ?? null}
          basisleeftijdSeizoenen={basisleeftijdSeizoenen}
          magBewerken={magBewerken}
          bewerkUrl={bewerkUrl}
          onSluiten={() => setGeselecteerd(null)}
        />
      )}

      <SectiesTabel
        secties={secties}
        actieveSectieId={actieveSectieId}
        onToggle={(id) => setActieveSectieId((huidig) => (huidig === id ? null : id))}
        magBewerken={magBewerken}
        sectieToevoegenUrl={sectieToevoegenUrl}
        bereikToevoegenUrl={bereikToevoegenUrl}
        bereikVerwijderenUrl={bereikVerwijderenUrl}
        aantalRijen={aantalRijen}
        aantalKolommen={aantalKolommen}
      />
    </Kaart>
  );
}

/** Klein formuliertje bij een cel: categorie, leeftijd, markering, opmerking. */
function CelPopover({
  rij,
  kolom,
  cel,
  basisleeftijdSeizoenen,
  magBewerken,
  bewerkUrl,
  onSluiten,
}: {
  rij: number;
  kolom: number;
  cel: Cel | null;
  basisleeftijdSeizoenen: number;
  magBewerken: boolean;
  bewerkUrl: string;
  onSluiten: () => void;
}) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function opslaan(event: ReactSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    const { error } = await actions.bewerkBaanschetsCel(new FormData(event.currentTarget));
    setBezig(false);
    if (error) {
      setFout(error.message);
      return;
    }
    window.location.reload();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(21,33,43,.5)] p-4"
      onClick={onSluiten}
    >
      <div
        role="dialog"
        aria-label={`Cel ${rij}/${kolom}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[360px] rounded-card bg-creme p-4 shadow-[var(--shadow-hover)]"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-extrabold text-ink">
            Mat {rij}/{kolom}
          </p>
          <button type="button" onClick={onSluiten} aria-label="Sluiten" className="text-text-muted">
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        {!magBewerken ? (
          cel ? (
            <dl className="mt-2 space-y-1 text-[13px] text-text-medium">
              <div>
                <dt className="inline font-bold text-ink">Categorie: </dt>
                <dd className="inline">{BAANSCHETS_LEGENDA[cel.categorie].label}</dd>
              </div>
              <div>
                <dt className="inline font-bold text-ink">Leeftijd: </dt>
                <dd className="inline">{cel.leeftijd ?? basisleeftijdSeizoenen} seizoenen</dd>
              </div>
              {cel.opmerking && <p className="italic">&ldquo;{cel.opmerking}&rdquo;</p>}
            </dl>
          ) : (
            <p className="mt-2 text-[13px] text-text-muted">Geen mat op deze plek.</p>
          )
        ) : (
          <form method="post" action={bewerkUrl} onSubmit={opslaan} className="mt-3 space-y-3">
            <input type="hidden" name="rij" value={rij} />
            <input type="hidden" name="kolom" value={kolom} />

            <div>
              <Label htmlFor="cel-categorie">Categorie</Label>
              <select
                id="cel-categorie"
                name="categorie"
                defaultValue={cel?.categorie ?? ""}
                className={inputClass}
              >
                <option value="">— geen mat (leegmaken) —</option>
                {Object.entries(BAANSCHETS_LEGENDA).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="cel-leeftijd">Leeftijd (seizoenen)</Label>
              <input
                id="cel-leeftijd"
                name="leeftijd"
                type="number"
                min={0}
                step={1}
                defaultValue={cel?.leeftijd ?? ""}
                placeholder={`volgt basisleeftijd (${basisleeftijdSeizoenen})`}
                className={inputClass}
              />
            </div>

            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                name="gemarkeerd"
                value="true"
                defaultChecked={cel?.gemarkeerd ?? false}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Fysiek geroteerd (onregelmatig versleten)
            </label>

            <div>
              <Label htmlFor="cel-opmerking">Opmerking (zichtbaar op de baanschets)</Label>
              <textarea
                id="cel-opmerking"
                name="opmerking"
                rows={2}
                defaultValue={cel?.opmerking ?? ""}
                className="w-full rounded-input border border-border-light bg-creme px-3 py-2 text-[13.5px] text-ink"
              />
            </div>

            <div>
              <Label htmlFor="cel-toelichting">Toelichting bij deze wijziging (voor het logboek)</Label>
              <textarea
                id="cel-toelichting"
                name="toelichting"
                rows={2}
                placeholder="Bijvoorbeeld: mat vervangen, kanten bijgewerkt…"
                className="w-full rounded-input border border-border-light bg-creme px-3 py-2 text-[13.5px] text-ink"
              />
            </div>

            {fout && <p className="text-[12.5px] text-red-text">{fout}</p>}

            <button
              type="submit"
              disabled={bezig}
              className="motion flex min-h-[44px] w-full items-center justify-center rounded-full bg-accent px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed disabled:opacity-60"
            >
              {bezig ? "Opslaan…" : "Opslaan"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function SectiesTabel({
  secties,
  actieveSectieId,
  onToggle,
  magBewerken,
  sectieToevoegenUrl,
  bereikToevoegenUrl,
  bereikVerwijderenUrl,
  aantalRijen,
  aantalKolommen,
}: {
  secties: SectieMetPosities[];
  actieveSectieId: string | null;
  onToggle: (id: string) => void;
  magBewerken: boolean;
  sectieToevoegenUrl: string;
  bereikToevoegenUrl: string;
  bereikVerwijderenUrl: string;
  aantalRijen: number;
  aantalKolommen: number;
}) {
  const [beheerOpen, setBeheerOpen] = useState<string | null>(null);
  const [nieuweSectie, setNieuweSectie] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [waarschuwing, setWaarschuwing] = useState<string | null>(null);

  async function sectieToevoegen(event: ReactSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    const { error } = await actions.voegBaanschetsSectieToe(new FormData(event.currentTarget));
    setBezig(false);
    if (error) {
      setFout(error.message);
      return;
    }
    window.location.reload();
  }

  async function bereikToevoegen(event: ReactSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    const { data, error } = await actions.voegBaanschetsSectieBereikToe(
      new FormData(event.currentTarget)
    );
    setBezig(false);
    if (error) {
      setFout(error.message);
      return;
    }
    if (data?.waarschuwing) {
      setWaarschuwing(data.waarschuwing);
      return;
    }
    window.location.reload();
  }

  async function bereikVerwijderen(bereikId: string) {
    setBezig(true);
    const formData = new FormData();
    formData.set("bereikId", bereikId);
    await actions.verwijderBaanschetsSectieBereik(formData);
    window.location.reload();
  }

  return (
    <div className="mt-4 border-t border-zand pt-4">
      <KaartTitel>Secties</KaartTitel>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[680px] text-[13px]">
          <thead>
            <tr className="border-b border-zand text-left text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-text-muted">
              <th className="py-2 pr-2">Sectie</th>
              <th className="py-2 pr-2">Celbereik(en)</th>
              {Object.values(KORTE_LABELS).map((label) => (
                <th key={label} className="py-2 pr-2 text-right">
                  {label}
                </th>
              ))}
              <th className="py-2 pr-2 text-right">Totaal</th>
              <th className="py-2 pr-2 text-right">m²</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {secties.map((s) => {
              const actief = actieveSectieId === s.id;
              return (
                <Fragment key={s.id}>
                  <tr
                    onClick={() => onToggle(s.id)}
                    className={`motion cursor-pointer border-b border-zand ${
                      actief ? "bg-accent-tint" : "hover:bg-neutral-fill"
                    }`}
                  >
                    <td className="py-2 pr-2 font-bold text-ink">
                      {s.nr}
                      {s.omschrijving && (
                        <span className="font-normal text-text-muted"> · {s.omschrijving}</span>
                      )}
                    </td>
                    <td className="py-2 pr-2 text-text-medium">
                      {s.bereiken.length === 0
                        ? "—"
                        : s.bereiken
                            .map((b) => `(${b.rijVan}-${b.rijTot}, ${b.kolomVan}-${b.kolomTot})`)
                            .join("; ")}
                    </td>
                    {Object.keys(KORTE_LABELS).map((key) => (
                      <td key={key} className="py-2 pr-2 text-right text-text-medium">
                        {s.totalen[key as BaanschetsCategorie]}
                      </td>
                    ))}
                    <td className="py-2 pr-2 text-right font-bold text-ink">{s.totaalAantal}</td>
                    <td className="py-2 pr-2 text-right text-text-medium">
                      {s.totaalM2.toFixed(2)}
                    </td>
                    <td className="py-2 text-right">
                      {magBewerken && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBeheerOpen((v) => (v === s.id ? null : s.id));
                          }}
                          className="text-[11px] font-bold uppercase tracking-[0.06em] text-link hover:underline"
                        >
                          beheren
                        </button>
                      )}
                    </td>
                  </tr>
                  {magBewerken && beheerOpen === s.id && (
                    <tr key={`${s.id}-beheer`}>
                      <td colSpan={11} className="bg-zand/40 px-2 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {s.bereiken.map((b) => (
                            // Los formulier, zodat verwijderen ook zonder JavaScript werkt.
                            <form
                              key={b.id}
                              method="post"
                              action={bereikVerwijderenUrl}
                              className="flex items-center gap-1.5 rounded-full border border-border-light bg-creme px-2.5 py-1 text-[11.5px]"
                            >
                              <input type="hidden" name="bereikId" value={b.id} />
                              rij {b.rijVan}-{b.rijTot}, kolom {b.kolomVan}-{b.kolomTot}
                              <button
                                type="submit"
                                onClick={(e) => {
                                  e.preventDefault();
                                  void bereikVerwijderen(b.id);
                                }}
                                disabled={bezig}
                                aria-label="Bereik verwijderen"
                                className="text-red-text hover:opacity-70"
                              >
                                <X size={11} strokeWidth={2.6} />
                              </button>
                            </form>
                          ))}
                        </div>
                        <form
                          method="post"
                          action={bereikToevoegenUrl}
                          onSubmit={bereikToevoegen}
                          className="mt-2 flex flex-wrap items-end gap-2"
                        >
                          <input type="hidden" name="sectieId" value={s.id} />
                          {(["rijVan", "rijTot", "kolomVan", "kolomTot"] as const).map((veld) => (
                            <div key={veld}>
                              <Label htmlFor={`${s.id}-${veld}`}>{veld}</Label>
                              <input
                                id={`${s.id}-${veld}`}
                                name={veld}
                                type="number"
                                min={1}
                                max={veld.startsWith("rij") ? aantalRijen : aantalKolommen}
                                required
                                className="h-9 w-16 rounded-input border border-border-light bg-creme px-2 text-[12.5px] text-ink"
                              />
                            </div>
                          ))}
                          <button
                            type="submit"
                            disabled={bezig}
                            className="motion flex h-9 items-center gap-1 rounded-full border-[1.5px] border-dashed border-link px-3 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-link hover:bg-accent-tint disabled:opacity-60"
                          >
                            <Plus size={13} strokeWidth={2.4} />
                            bereik toevoegen
                          </button>
                        </form>
                        {waarschuwing && (
                          <p className="mt-2 text-[12px] font-bold text-amber-text">{waarschuwing}</p>
                        )}
                        {fout && <p className="mt-2 text-[12px] text-red-text">{fout}</p>}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {magBewerken &&
        (nieuweSectie ? (
          <form
            method="post"
            action={sectieToevoegenUrl}
            onSubmit={sectieToevoegen}
            className="mt-3 flex flex-wrap items-end gap-2"
          >
            <div>
              <Label htmlFor="nieuwe-sectie-nr">Nr.</Label>
              <input
                id="nieuwe-sectie-nr"
                name="nr"
                type="number"
                min={1}
                required
                className="h-9 w-16 rounded-input border border-border-light bg-creme px-2 text-[12.5px] text-ink"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="nieuwe-sectie-omschrijving">Omschrijving</Label>
              <input
                id="nieuwe-sectie-omschrijving"
                name="omschrijving"
                className="h-9 w-full min-w-[140px] rounded-input border border-border-light bg-creme px-2 text-[12.5px] text-ink"
              />
            </div>
            <button
              type="submit"
              disabled={bezig}
              className="motion h-9 rounded-full bg-accent px-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-accent-on disabled:opacity-60"
            >
              Opslaan
            </button>
            <button
              type="button"
              onClick={() => setNieuweSectie(false)}
              className="motion h-9 rounded-full border-[1.5px] border-border-light px-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-text-medium"
            >
              Annuleren
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setNieuweSectie(true)}
            className="motion mt-3 flex items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-link px-3 py-2 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-link hover:bg-accent-tint"
          >
            <Plus size={14} strokeWidth={2.4} />
            Sectie toevoegen
          </button>
        ))}

      {!magBewerken && (
        <p className="mt-2 flex items-center gap-1 text-[11.5px] text-text-muted">
          <ChevronRight size={12} strokeWidth={2.4} />
          Klik op een sectie om 'm op de baan hierboven te laten oplichten.
        </p>
      )}
    </div>
  );
}

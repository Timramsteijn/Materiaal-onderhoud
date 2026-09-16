"use client";

import { useState } from "react";
import { Kaart, KaartTitel } from "@/components/ui";
import { Download, Upload } from "@/components/icons";

export function ExcelKaart({
  slug,
  laatsteImport,
  melding,
  meldingTekst,
}: {
  slug: string;
  laatsteImport: { datum: string; regels: number; overgeslagen: number } | null;
  melding: "ok" | "fout" | null;
  meldingTekst: string;
}) {
  const [bezig, setBezig] = useState(false);

  return (
    <Kaart>
      <div className="desktop:flex desktop:items-center desktop:justify-between desktop:gap-6">
        <div>
          <KaartTitel>Excel</KaartTitel>
          <p className="mt-1 text-[12.5px] text-text-muted">
            {laatsteImport
              ? `Laatste import: ${laatsteImport.datum} · ${laatsteImport.regels} regels · ${laatsteImport.overgeslagen} overgeslagen`
              : "Nog geen import uitgevoerd."}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5 desktop:mt-0">
          <form
            action={`/api/import?onderdeel=${slug}`}
            method="post"
            encType="multipart/form-data"
            onSubmit={() => setBezig(true)}
            className="flex flex-wrap items-center gap-2.5"
          >
            <input
              id="bestand"
              name="bestand"
              type="file"
              accept=".xlsx,.xls"
              required
              aria-label="Excel-bestand kiezen"
              className="max-w-[210px] text-[12.5px] text-text-medium file:mr-2 file:rounded-full file:border-0 file:bg-neutral-fill file:px-3 file:py-2 file:text-[12px] file:font-bold file:uppercase file:tracking-[0.08em] file:text-ink"
            />
            <button
              type="submit"
              disabled={bezig}
              className="motion flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed disabled:opacity-60"
            >
              <Download size={15} strokeWidth={2} />
              {bezig ? "Bezig…" : "Importeren"}
            </button>
          </form>

          <a
            href={`/api/export?onderdeel=${slug}`}
            className="motion flex min-h-[44px] items-center gap-2 rounded-full border-[1.5px] border-ink px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-ink hover:bg-neutral-fill"
          >
            <Upload size={15} strokeWidth={2} />
            Exporteren
          </a>
        </div>
      </div>

      {melding && (
        <p
          className={`mt-3 rounded-input px-3 py-2 text-[12.5px] ${
            melding === "ok" ? "bg-green-tint text-green-text" : "bg-red-tint text-red-text"
          }`}
        >
          {meldingTekst}
        </p>
      )}
    </Kaart>
  );
}

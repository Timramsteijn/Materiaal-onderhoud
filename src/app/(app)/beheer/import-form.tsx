"use client";

import { useState } from "react";
import { Download } from "@/components/icons";

export function ImportForm() {
  const [bezig, setBezig] = useState(false);

  return (
    <form
      action="/api/import"
      method="post"
      encType="multipart/form-data"
      onSubmit={() => setBezig(true)}
    >
      <label
        className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-text-dark-secondary"
        htmlFor="bestand"
      >
        Excel-bestand (tabblad &quot;Materiaal&quot;, optioneel &quot;Onderhoudslog&quot;)
      </label>
      <input
        id="bestand"
        name="bestand"
        type="file"
        accept=".xlsx,.xls"
        required
        className="block w-full text-[13px] text-ink"
      />
      <button
        type="submit"
        disabled={bezig}
        className="mt-2.5 flex items-center gap-1.5 rounded-full bg-steel px-4 py-2 text-[13px] font-bold uppercase tracking-[0.03em] text-white disabled:opacity-60"
      >
        <Download size={15} strokeWidth={2} />
        {bezig ? "Bezig met uploaden..." : "Importeren"}
      </button>
    </form>
  );
}

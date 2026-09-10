"use client";

import { useState } from "react";

export function ImportForm() {
  const [bezig, setBezig] = useState(false);

  return (
    <form
      action="/api/import"
      method="post"
      encType="multipart/form-data"
      onSubmit={() => setBezig(true)}
    >
      <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft" htmlFor="bestand">
        Importeer Excel-bestand (tabblad &quot;Materiaal&quot;, optioneel &quot;Onderhoudslog&quot;)
      </label>
      <input
        id="bestand"
        name="bestand"
        type="file"
        accept=".xlsx,.xls"
        required
        className="block w-full text-[13px]"
      />
      <button
        type="submit"
        disabled={bezig}
        className="mt-2 rounded-lg bg-ice px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
      >
        {bezig ? "Bezig met uploaden..." : "⬆️ Importeren"}
      </button>
    </form>
  );
}

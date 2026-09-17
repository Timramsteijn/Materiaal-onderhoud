import { useRef } from "react";
import { Search } from "@/components/icons";

/**
 * Live zoeken: filtert op ID + merk/model, gecombineerd met de filterpills.
 * Het huidige pad en de queryparameters komen als prop binnen — in Astro is er
 * geen router-hook. Het veld staat in een gewoon GET-formulier, dus zonder
 * JavaScript werkt zoeken nog steeds via Enter.
 */
export function Zoekveld({
  pad,
  query,
  placeholder = "Zoek op ID, merk of model",
}: {
  pad: string;
  /** De huidige querystring, zonder vraagteken. */
  query: string;
  placeholder?: string;
}) {
  const params = new URLSearchParams(query);
  const beginwaarde = params.get("q") ?? "";
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // De overige filters blijven staan bij het zoeken.
  const overige = [...params.entries()].filter(([naam]) => naam !== "q");

  return (
    <form method="get" action={pad} className="relative min-w-0 flex-1">
      {overige.map(([naam, waarde]) => (
        <input key={naam} type="hidden" name={naam} value={waarde} />
      ))}
      <Search
        size={17}
        strokeWidth={2}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="search"
        name="q"
        defaultValue={beginwaarde}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => {
          const formulier = e.currentTarget.form;
          if (!formulier) return;
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => formulier.requestSubmit(), 350);
        }}
        className="h-12 w-full rounded-input border border-border-light bg-creme pl-10 pr-3.5 text-[14.5px] text-ink placeholder:text-text-muted desktop:h-10 desktop:rounded-full"
      />
    </form>
  );
}

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Search } from "@/components/icons";

function Veld({
  initieel,
  placeholder,
  onWijziging,
}: {
  initieel: string;
  placeholder: string;
  onWijziging: (waarde: string) => void;
}) {
  const [waarde, setWaarde] = useState(initieel);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div className="relative min-w-0 flex-1">
      <Search
        size={17}
        strokeWidth={2}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="search"
        value={waarde}
        placeholder={placeholder}
        onChange={(e) => {
          const volgende = e.target.value;
          setWaarde(volgende);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => onWijziging(volgende), 250);
        }}
        className="h-12 w-full rounded-input border border-border-light bg-creme pl-10 pr-3.5 text-[14.5px] text-ink placeholder:text-text-muted desktop:h-10 desktop:rounded-full"
      />
    </div>
  );
}

/** Live zoeken: filtert op ID + merk/model, gecombineerd met de filterpills. */
export function Zoekveld({ placeholder = "Zoek op ID, merk of model" }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Veld
      // Remount als de query van buitenaf wijzigt (bv. door een filterpill),
      // zodat het veld zonder effect-synchronisatie in de pas blijft.
      key={searchParams.toString()}
      initieel={searchParams.get("q") ?? ""}
      placeholder={placeholder}
      onWijziging={(volgende) => {
        const params = new URLSearchParams(searchParams);
        if (volgende.trim()) params.set("q", volgende.trim());
        else params.delete("q");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      }}
    />
  );
}

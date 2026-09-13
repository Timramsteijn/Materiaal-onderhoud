"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Search } from "@/components/icons";

function SearchInput({
  initial,
  placeholder,
  onDebouncedChange,
}: {
  initial: string;
  placeholder: string;
  onDebouncedChange: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onDebouncedChange(next), 250);
  }

  return (
    <div className="relative flex-1">
      <Search
        size={17}
        strokeWidth={2}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-border-light bg-card pl-10 pr-3.5 text-[14.5px] text-ink placeholder:text-text-muted desktop:h-10 desktop:rounded-full desktop:bg-input-fill"
      />
    </div>
  );
}

export function SearchBar({ placeholder = "Zoek op ID, merk of model" }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <SearchInput
      key={searchParams.toString()}
      initial={searchParams.get("q") ?? ""}
      placeholder={placeholder}
      onDebouncedChange={(next) => {
        const params = new URLSearchParams(searchParams);
        if (next.trim()) params.set("q", next.trim());
        else params.delete("q");
        params.delete("id");
        router.replace(`${pathname}?${params.toString()}`);
      }}
    />
  );
}

"use client";

import { useTransition } from "react";
import { deleteMaterial } from "@/lib/actions/materialen";

export function DeleteMaterialButton({ materialId }: { materialId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Materiaal ${materialId} definitief verwijderen?`)) {
          startTransition(() => deleteMaterial(materialId));
        }
      }}
      className="mt-3 w-full rounded-lg border border-danger px-4 py-2.5 text-[13.5px] font-semibold text-danger disabled:opacity-60"
    >
      {pending ? "Bezig..." : "Materiaal verwijderen"}
    </button>
  );
}

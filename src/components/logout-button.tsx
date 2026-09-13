"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "@/components/icons";

/**
 * Client-side uitloggen (i.p.v. een Server Action) — een "use server"-form
 * hier in de layout bleek andere Server Actions elders op dezelfde pagina
 * (bv. materiaal toevoegen) te laten mislukken doordat de sessie halverwege
 * werd opgeschoond. Dit omzeilt dat probleem volledig.
 */
export function LogoutButton({
  variant = "dark",
}: {
  /** "dark" = op donkere chrome (mobiele header), "light" = op witte topbar (desktop). */
  variant?: "dark" | "light";
}) {
  const shape = variant === "dark" ? "rounded-[10px]" : "rounded-full";
  const colors =
    variant === "dark"
      ? "border-border-dark text-white hover:border-orange"
      : "border-card-border text-ink hover:border-orange";

  return (
    <button
      type="button"
      onClick={() => signOut({ redirectTo: "/login" })}
      aria-label="Uitloggen"
      className={`flex h-9 w-9 shrink-0 items-center justify-center border transition-colors ${shape} ${colors}`}
    >
      <LogOut size={17} strokeWidth={1.9} />
    </button>
  );
}

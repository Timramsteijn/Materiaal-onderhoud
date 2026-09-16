"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "@/components/icons";

/**
 * Client-side uitloggen (i.p.v. een Server Action) — een "use server"-form
 * hier in de layout bleek andere Server Actions elders op dezelfde pagina
 * (bv. materiaal toevoegen) te laten mislukken doordat de sessie halverwege
 * werd opgeschoond. Dit omzeilt dat probleem volledig.
 */
export function LogoutButton({ variant = "donker" }: { variant?: "donker" | "licht" }) {
  const stijl =
    variant === "donker"
      ? "rounded-[10px] border-border-dark text-creme hover:border-accent"
      : "rounded-full border-border-light text-ink hover:border-accent";

  return (
    <button
      type="button"
      onClick={() => signOut({ redirectTo: "/inloggen" })}
      aria-label="Uitloggen"
      className={`motion flex h-9 w-9 shrink-0 items-center justify-center border ${stijl}`}
    >
      <LogOut size={17} strokeWidth={2} />
    </button>
  );
}

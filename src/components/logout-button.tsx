"use client";

import { signOut } from "next-auth/react";

/**
 * Client-side uitloggen (i.p.v. een Server Action) — een "use server"-form
 * hier in de layout bleek andere Server Actions elders op dezelfde pagina
 * (bv. materiaal toevoegen) te laten mislukken doordat de sessie halverwege
 * werd opgeschoond. Dit omzeilt dat probleem volledig.
 */
export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectTo: "/login" })}
      className="rounded-full border border-white/25 px-3 py-1.5 text-[12.5px] text-white/85"
    >
      Uitloggen
    </button>
  );
}

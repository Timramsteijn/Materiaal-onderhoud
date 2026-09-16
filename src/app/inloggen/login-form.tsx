"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { ArrowRight } from "@/components/icons";

export function LoginForm({ variant = "licht" }: { variant?: "donker" | "licht" }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const donker = variant === "donker";

  const label = `mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] ${
    donker ? "text-text-on-dark" : "text-text-muted"
  }`;
  const input = `h-12 w-full rounded-input border px-3.5 text-[15px] ${
    donker
      ? "border-border-dark bg-navy-light text-creme placeholder:text-text-on-dark/60"
      : "border-border-light bg-[#f4f2ec] text-ink placeholder:text-text-muted"
  }`;

  return (
    <form action={action} className="mt-8 desktop:mt-0">
      <label htmlFor={`gebruikersnaam-${variant}`} className={label}>
        Gebruikersnaam
      </label>
      <input
        id={`gebruikersnaam-${variant}`}
        name="gebruikersnaam"
        type="text"
        autoComplete="username"
        placeholder="t.verhoeven"
        required
        className={input}
      />

      <label htmlFor={`wachtwoord-${variant}`} className={`${label} mt-4`}>
        Wachtwoord
      </label>
      <input
        id={`wachtwoord-${variant}`}
        name="wachtwoord"
        type="password"
        autoComplete="current-password"
        required
        className={input}
      />

      {state?.error && (
        <p className="mt-3 rounded-input bg-red-tint px-3 py-2 text-[13px] text-red-text">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="motion lift mt-6 flex h-[52px] w-full items-center justify-between rounded-full bg-accent px-5 text-[14px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed disabled:opacity-60"
      >
        {pending ? "Bezig met inloggen…" : "Inloggen"}
        <ArrowRight size={18} strokeWidth={2} />
      </button>

      <p
        className={`mt-5 text-[13px] ${donker ? "text-text-on-dark" : "text-text-muted"}`}
      >
        Wachtwoord vergeten? Vraag je locatiebeheerder.
      </p>
    </form>
  );
}

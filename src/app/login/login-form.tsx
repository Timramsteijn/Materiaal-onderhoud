"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { ArrowRight } from "@/components/icons";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <form action={action}>
      <label
        htmlFor="gebruikersnaam"
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-text-dark-secondary"
      >
        Gebruikersnaam
      </label>
      <input
        id="gebruikersnaam"
        name="gebruikersnaam"
        type="text"
        autoComplete="username"
        placeholder="t.verhoeven"
        required
        autoFocus
        className="h-12 w-full rounded-xl border border-border-dark bg-ink-light px-3.5 text-[15px] text-white placeholder:text-text-dark-secondary/60"
      />

      <label
        htmlFor="wachtwoord"
        className="mb-1.5 mt-4 block text-[11px] font-semibold uppercase tracking-[0.08em] text-text-dark-secondary"
      >
        Wachtwoord
      </label>
      <input
        id="wachtwoord"
        name="wachtwoord"
        type="password"
        autoComplete="current-password"
        required
        className="h-12 w-full rounded-xl border border-border-dark bg-ink-light px-3.5 text-[15px] text-white"
      />

      {state?.error && (
        <p className="mt-3 rounded-lg bg-red-tint px-3 py-2 text-[13px] text-red">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 flex h-[52px] w-full items-center justify-between rounded-full bg-orange px-5 text-[14.5px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-orange-hover disabled:opacity-60"
      >
        {pending ? "Bezig met inloggen..." : "Inloggen"}
        <ArrowRight size={18} strokeWidth={2} />
      </button>

      <p className="mt-5 text-center text-[13px] text-text-dark-secondary">
        Wachtwoord vergeten? Vraag je locatiebeheerder.
      </p>
    </form>
  );
}

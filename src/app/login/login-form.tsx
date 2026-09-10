"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="rounded-2xl bg-panel p-6 shadow-sm">
      <label htmlFor="gebruikersnaam" className="mb-1.5 mt-3 block text-[12.5px] font-semibold text-ink-soft first:mt-0">
        Gebruikersnaam
      </label>
      <input
        id="gebruikersnaam"
        name="gebruikersnaam"
        type="text"
        autoComplete="username"
        required
        autoFocus
        className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[15px] text-ink"
      />

      <label htmlFor="wachtwoord" className="mb-1.5 mt-3 block text-[12.5px] font-semibold text-ink-soft">
        Wachtwoord
      </label>
      <input
        id="wachtwoord"
        name="wachtwoord"
        type="password"
        autoComplete="current-password"
        required
        className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[15px] text-ink"
      />

      {state?.error && (
        <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-lg bg-amber px-4 py-3 text-[14.5px] font-semibold text-graphite disabled:opacity-60"
      >
        {pending ? "Bezig met inloggen..." : "Inloggen"}
      </button>
    </form>
  );
}

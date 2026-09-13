"use client";

import { useActionState, useTransition } from "react";
import type { User } from "@prisma/client";
import { createUser, setGebruikerActief, type FormState } from "@/lib/actions/gebruikers";
import { ROLE_LABELS } from "@/lib/domain";

const inputClass =
  "w-full rounded-lg border border-border-light bg-input-fill px-3 py-2 text-[14px] text-ink";

function ToggleSwitch({
  actief,
  disabled,
  onToggle,
}: {
  actief: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actief}
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors disabled:opacity-40 ${
        actief ? "bg-green" : "bg-toggle-off"
      }`}
    >
      <span
        className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform ${
          actief ? "translate-x-[21px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export function UserManager({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createUser, undefined);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2.5">
      <ul className="space-y-2 desktop:grid desktop:grid-cols-2 desktop:gap-2.5 desktop:space-y-0">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between gap-3 rounded-[10px] bg-card px-3.5 py-3 shadow-[var(--shadow-card-light)]"
          >
            <div className="min-w-0">
              <p className="text-[14.5px] font-medium text-ink">
                {u.naam}{" "}
                <span className="text-[11.5px] font-normal text-text-muted">
                  @{u.gebruikersnaam}
                </span>
              </p>
              <p className="mt-0.5 text-[12px] text-text-dark-secondary">{ROLE_LABELS[u.role]}</p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  u.actief ? "bg-green-tint text-green-text" : "bg-card-border text-text-muted"
                }`}
              >
                {u.actief ? "Actief" : "Inactief"}
              </span>
            </div>
            <ToggleSwitch
              actief={u.actief}
              disabled={u.id === currentUserId}
              onToggle={() => startTransition(() => setGebruikerActief(u.id, !u.actief))}
            />
          </li>
        ))}
      </ul>

      <details className="rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)]">
        <summary className="font-display cursor-pointer text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-ink">
          + Nieuwe medewerker
        </summary>
        <form action={action} className="mt-3 space-y-2">
          <input name="naam" placeholder="Naam" required className={inputClass} />
          <input
            name="gebruikersnaam"
            placeholder="Gebruikersnaam"
            required
            className={inputClass}
          />
          <input
            name="wachtwoord"
            type="password"
            placeholder="Tijdelijk wachtwoord (min. 8 tekens)"
            required
            className={inputClass}
          />
          <select name="role" defaultValue="INSTRUCTEUR" className={inputClass}>
            <option value="INSTRUCTEUR">Instructeur</option>
            <option value="DUTY_MANAGER">Duty manager</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-orange px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-orange-hover disabled:opacity-60"
          >
            {pending ? "Bezig..." : "Medewerker toevoegen"}
          </button>
        </form>
        {state?.error && <p className="mt-2 text-[12.5px] text-red">{state.error}</p>}
      </details>
    </div>
  );
}

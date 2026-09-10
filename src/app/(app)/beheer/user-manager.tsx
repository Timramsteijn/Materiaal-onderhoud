"use client";

import { useActionState, useTransition } from "react";
import type { User } from "@prisma/client";
import { createUser, setGebruikerActief, type FormState } from "@/lib/actions/gebruikers";
import { ROLE_LABELS } from "@/lib/domain";

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-[14px] text-ink";

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
    <div className="space-y-2">
      <ul className="space-y-2">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between rounded-xl bg-panel px-3.5 py-2.5 shadow-sm"
          >
            <div>
              <p className="text-[13.5px] font-medium text-ink">
                {u.naam}{" "}
                <span className="text-[11.5px] font-normal text-ink-soft">
                  @{u.gebruikersnaam}
                </span>
              </p>
              <p className="text-[11.5px] text-ink-soft">
                {ROLE_LABELS[u.role]} · {u.actief ? "actief" : "gedeactiveerd"}
              </p>
            </div>
            <button
              type="button"
              disabled={u.id === currentUserId}
              onClick={() => startTransition(() => setGebruikerActief(u.id, !u.actief))}
              className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11.5px] font-semibold text-ink-soft disabled:opacity-40"
            >
              {u.actief ? "Deactiveren" : "Activeren"}
            </button>
          </li>
        ))}
      </ul>

      <details className="rounded-2xl bg-panel p-4 shadow-sm">
        <summary className="label-font cursor-pointer text-[14px] text-ink">
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
            className="w-full rounded-lg bg-amber px-4 py-2 text-[13px] font-semibold text-graphite disabled:opacity-60"
          >
            {pending ? "Bezig..." : "Medewerker toevoegen"}
          </button>
        </form>
        {state?.error && <p className="mt-2 text-[12.5px] text-danger">{state.error}</p>}
      </details>
    </div>
  );
}

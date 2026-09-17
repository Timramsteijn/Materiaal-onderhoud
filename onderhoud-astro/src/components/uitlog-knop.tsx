import { LogOut } from "@/components/icons";

/**
 * Uitloggen is een gewone POST naar /uitloggen: die maakt de sessie in KV leeg
 * en stuurt door naar het inlogscherm. Geen JavaScript nodig.
 */
export function UitlogKnop({ variant = "donker" }: { variant?: "donker" | "licht" }) {
  const stijl =
    variant === "donker"
      ? "rounded-[10px] border-border-dark text-creme hover:border-accent"
      : "rounded-full border-border-light text-ink hover:border-accent";

  return (
    <form method="post" action="/uitloggen" className="shrink-0">
      <button
        type="submit"
        aria-label="Uitloggen"
        className={`motion flex h-9 w-9 shrink-0 items-center justify-center border ${stijl}`}
      >
        <LogOut size={17} strokeWidth={2} />
      </button>
    </form>
  );
}

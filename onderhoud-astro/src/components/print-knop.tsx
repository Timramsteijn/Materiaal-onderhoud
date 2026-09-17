import { Printer } from "@/components/icons";

/**
 * De enige client-component in de printweergaven. Krijgt `no-print`, zodat de
 * knop zelf nooit op papier belandt.
 */
export function PrintKnop() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print motion lift flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-accent px-5 text-[12.5px] font-extrabold uppercase tracking-[0.1em] text-accent-on hover:bg-accent-pressed"
    >
      <Printer size={18} strokeWidth={2} aria-hidden="true" />
      Printen
    </button>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/logo";

export default async function InloggenPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/onderdeel");
  }

  return (
    <div className="flex min-h-full flex-col desktop:flex-row">
      {/* Merkpaneel: volledig scherm op mobiel, 520px kolom op desktop */}
      <div className="flex flex-col justify-between bg-navy px-8 py-10 desktop:w-[520px] desktop:shrink-0 desktop:px-12 desktop:py-14">
        <Logo variant="merkteken" size={52} className="text-accent" />
        <div className="mt-10 desktop:mt-0">
          <h1 className="display text-[34px] leading-[1.05] text-creme desktop:text-[44px]">
            Materiaal
            <br />
            Onderhoud
          </h1>
          <p className="mt-3 max-w-[38ch] text-[15px] text-text-on-dark">
            Onderhoud aan verhuurmateriaal registreren via de QR-sticker op het materiaal.
          </p>
          <p className="mt-6 border-t border-border-dark pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-text-on-dark">
            Outdoor Valley
          </p>
        </div>
        <div className="desktop:hidden">
          <LoginForm variant="donker" />
        </div>
      </div>

      {/* Kaart op de zandgrond — alleen desktop; op mobiel staat het formulier hierboven */}
      <div className="hidden flex-1 items-center justify-center bg-zand p-10 desktop:flex">
        <div className="w-full max-w-[420px] rounded-card bg-creme p-8 shadow-[var(--shadow-card)]">
          <h2 className="display text-[26px] text-ink">Inloggen</h2>
          <p className="mb-6 mt-1 text-[13.5px] text-text-muted">
            Met je Outdoor Valley medewerkersaccount.
          </p>
          <LoginForm variant="licht" />
        </div>
      </div>
    </div>
  );
}

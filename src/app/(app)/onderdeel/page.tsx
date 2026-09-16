import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accentStyle } from "@/lib/accent";
import { formatAantal } from "@/lib/domain";
import { AppHeader } from "@/components/app-header";
import { LogoutButton } from "@/components/logout-button";
import { Logo } from "@/components/logo";
import { onderdeelIcoon, ArrowRight, ChevronRight } from "@/components/icons";

export default async function OnderdeelKiezenPage() {
  const [session, onderdelen] = await Promise.all([
    auth(),
    prisma.onderdeel.findMany({
      orderBy: { sortering: "asc" },
      include: { _count: { select: { materiaal: true } } },
    }),
  ]);

  const kaarten = onderdelen.map((o) => ({
    ...o,
    aantal: o._count.materiaal > 0 ? o._count.materiaal : o.aantalIndicatie,
  }));

  return (
    <>
      <AppHeader medewerkerNaam={session!.user.naam} />

      {/* Desktop: donkere topbalk, geen zijnav — er is nog geen onderdeel gekozen */}
      <div className="no-print hidden h-[66px] items-center justify-between bg-navy px-6 desktop:flex">
        <div className="flex items-center gap-2.5 text-creme">
          <Logo variant="merkteken" size={26} className="text-accent" />
          <span className="text-[13px] font-extrabold uppercase leading-[1.15] tracking-[0.1em]">
            Materiaal
            <br />
            Onderhoud
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[13px] font-semibold text-creme">{session!.user.naam}</p>
            <p className="text-[11px] text-text-on-dark">{session!.user.functie}</p>
          </div>
          <LogoutButton variant="donker" />
        </div>
      </div>

      <main className="flex-1 px-[18px] py-6 desktop:px-12 desktop:py-10">
        <h1 className="display text-[24px] text-ink desktop:text-[30px]">Kies een onderdeel</h1>
        <p className="mb-5 mt-1 text-[13.5px] text-text-muted">
          Alles wat je hierna doet valt onder dit onderdeel.
        </p>

        <ul className="grid gap-3 desktop:grid-cols-3 desktop:gap-4">
          {kaarten.map((o) => {
            const Icon = onderdeelIcoon(o.icoon);
            return (
              <li key={o.id} style={accentStyle(o)}>
                <Link
                  href={`/${o.slug}/scannen`}
                  prefetch={false}
                  className={`motion lift flex h-full items-center gap-3.5 rounded-card bg-creme p-4 shadow-[var(--shadow-light)] desktop:flex-col desktop:items-start desktop:gap-3 desktop:p-5 ${
                    o.uitgelicht
                      ? "border-2 border-accent"
                      : "border border-border-light hover:border-accent"
                  }`}
                >
                  {/* Elke kaart draagt de eigen accentkleur van dat onderdeel */}
                  <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-card bg-accent-tint text-accent-ink desktop:h-[52px] desktop:w-[52px]">
                    <Icon size={24} strokeWidth={2} />
                  </span>

                  <div className="min-w-0 flex-1 desktop:w-full">
                    <p className="display text-[17px] text-ink desktop:text-[19px]">{o.naam}</p>
                    <p className="mt-0.5 text-[13px] text-text-muted">
                      {formatAantal(o.aantal)} stuks
                      {o.uitgelicht ? " · meest gebruikt" : ""}
                    </p>
                  </div>

                  <ChevronRight
                    size={20}
                    strokeWidth={2}
                    className="shrink-0 text-accent-ink desktop:hidden"
                  />

                  <span className="mt-1 hidden w-full items-center justify-between border-t border-border-light pt-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-ink desktop:flex">
                    Kies dit onderdeel
                    <ArrowRight size={15} strokeWidth={2} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}

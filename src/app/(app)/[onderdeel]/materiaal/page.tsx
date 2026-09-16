import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOnderdeel } from "@/lib/onderdeel";
import { TopBar } from "@/components/top-bar";
import { Zoekveld } from "./zoekveld";
import { MateriaalLijst } from "./materiaal-lijst";
import { ScanLine, Package, Plus } from "@/components/icons";

export default async function MateriaalPage({
  params,
  searchParams,
}: {
  params: Promise<{ onderdeel: string }>;
  searchParams: Promise<{ q?: string; categorie?: string }>;
}) {
  const [{ onderdeel: slug }, filters] = await Promise.all([params, searchParams]);
  const [session, onderdeel] = await Promise.all([auth(), getOnderdeel(slug)]);

  return (
    <>
      <TopBar medewerkerNaam={session!.user.naam} functie={session!.user.functie}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 max-w-[420px] flex-1">
            <Zoekveld />
          </div>
          <Link
            href={`/${slug}/scannen`}
            prefetch={false}
            className="motion flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed"
          >
            <ScanLine size={16} strokeWidth={2} />
            QR scannen
          </Link>
          <Link
            href={`/${slug}/materiaal/nieuw`}
            prefetch={false}
            className="motion flex h-10 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-ink px-4 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-ink hover:bg-neutral-fill"
          >
            <Plus size={16} strokeWidth={2} />
            Nieuw
          </Link>
        </div>
      </TopBar>

      <main className="flex flex-1 pb-24 desktop:pb-0">
        <div className="w-full desktop:w-[392px] desktop:shrink-0 desktop:overflow-y-auto desktop:border-r desktop:border-border-light">
          <MateriaalLijst
            slug={slug}
            onderdeelId={onderdeel.id}
            onderdeelNaam={onderdeel.naam}
            filters={filters}
          />
        </div>

        {/* Rechterkolom op desktop: nog geen materiaal geselecteerd */}
        <div className="hidden flex-1 items-center justify-center p-10 text-center desktop:flex">
          <div className="max-w-[36ch] text-text-muted">
            <Package size={28} strokeWidth={2} className="mx-auto mb-3" />
            <p className="text-[13.5px]">
              Kies materiaal uit de lijst om het kaartje te bekijken, of scan de QR-sticker.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

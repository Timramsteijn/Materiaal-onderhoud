import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOnderdeel, getCategorieen } from "@/lib/onderdeel";
import { TopBar } from "@/components/top-bar";
import { ChevronLeft } from "@/components/icons";
import { NieuwMateriaalFormulier } from "./formulier";

export default async function NieuwMateriaalPage({
  params,
  searchParams,
}: {
  params: Promise<{ onderdeel: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const [{ onderdeel: slug }, { id }] = await Promise.all([params, searchParams]);
  const [session, onderdeel] = await Promise.all([auth(), getOnderdeel(slug)]);
  const categorieen = await getCategorieen(onderdeel.id);

  return (
    <>
      <TopBar
        titel="Nieuw materiaal"
        subregel={`Wordt toegevoegd aan ${onderdeel.naam}`}
        medewerkerNaam={session!.user.naam}
        functie={session!.user.functie}
      />

      <main className="flex-1 px-[18px] pb-24 pt-4 desktop:px-6 desktop:pb-8 desktop:pt-6">
        <Link
          href={`/${slug}/materiaal`}
          prefetch={false}
          className="motion mb-3 flex items-center gap-1 text-[13px] font-semibold text-link hover:underline"
        >
          <ChevronLeft size={16} strokeWidth={2} />
          Terug naar materiaal
        </Link>

        <div className="desktop:hidden">
          <h1 className="display text-[22px] text-ink">Nieuw materiaal</h1>
          <p className="mb-4 mt-1 text-[13px] text-text-muted">
            Wordt toegevoegd aan {onderdeel.naam}.
          </p>
        </div>

        {categorieen.length === 0 ? (
          <p className="text-[13.5px] text-text-muted">
            Er zijn nog geen categorieën in dit onderdeel. Vraag een beheerder om er eerst een aan
            te maken via Beheer.
          </p>
        ) : (
          <NieuwMateriaalFormulier
            slug={slug}
            onderdeelId={onderdeel.id}
            categorieen={categorieen.map((c) => ({ id: c.id, naam: c.naam }))}
            beginId={id ?? ""}
          />
        )}
      </main>
    </>
  );
}

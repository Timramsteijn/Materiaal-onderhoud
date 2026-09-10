import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDutyManager } from "@/lib/permissions";
import { CategoryManager } from "./category-manager";
import { UserManager } from "./user-manager";
import { ImportForm } from "./import-form";

export default async function BeheerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session?.user || !isDutyManager(session.user.role)) {
    redirect("/overzicht");
  }

  const params = await searchParams;
  const [categories, users] = await Promise.all([
    prisma.category.findMany({ orderBy: { naam: "asc" } }),
    prisma.user.findMany({ orderBy: { naam: "asc" } }),
  ]);

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="mb-3 text-xl text-ink">Beheer</h1>

      <h2 className="mb-2 text-[15px] text-ink">Excel import/export</h2>
      <div className="rounded-2xl bg-panel p-4 shadow-sm">
        <a
          href="/api/export"
          className="inline-block rounded-lg bg-graphite px-4 py-2 text-[13px] font-semibold text-white"
        >
          ⬇️ Exporteer materiaal + log (.xlsx)
        </a>
        <div className="mt-3 border-t border-border pt-3">
          <ImportForm />
          {params.error && (
            <p className="mt-2 rounded-lg bg-danger-bg px-3 py-2 text-[12.5px] text-danger">
              {params.error}
            </p>
          )}
          {params.ok && (
            <p className="mt-2 rounded-lg bg-good-bg px-3 py-2 text-[12.5px] text-good">
              Materiaal: {params.matToegevoegd} nieuw, {params.matBijgewerkt} bijgewerkt
              {Number(params.matOvergeslagen) > 0
                ? `, ${params.matOvergeslagen} overgeslagen (onbekende categorie)`
                : ""}
              . Onderhoudslog: {params.logToegevoegd} nieuw
              {Number(params.logOvergeslagen) > 0
                ? `, ${params.logOvergeslagen} overgeslagen (al aanwezig of onbekend materiaal)`
                : ""}
              .
            </p>
          )}
        </div>
      </div>

      <h2 className="mb-2 mt-5 text-[15px] text-ink">Categorieen &amp; onderhoudsacties</h2>
      <CategoryManager categories={categories} />

      <h2 className="mb-2 mt-5 text-[15px] text-ink">Medewerkers</h2>
      <UserManager users={users} currentUserId={session.user.id} />
    </div>
  );
}

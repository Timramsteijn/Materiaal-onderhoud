import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDutyManager } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
import { TopBar } from "@/components/top-bar";
import { ROLE_LABELS } from "@/lib/domain";
import { CategoryManager } from "./category-manager";
import { UserManager } from "./user-manager";
import { ImportForm } from "./import-form";
import { Upload } from "@/components/icons";

export default async function BeheerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session?.user || !isDutyManager(session.user.role)) {
    redirect("/onderdeel");
  }

  const params = await searchParams;
  const [departments, users] = await Promise.all([
    prisma.department.findMany({
      orderBy: { naam: "asc" },
      include: { categories: { orderBy: { naam: "asc" } } },
    }),
    prisma.user.findMany({ orderBy: { naam: "asc" } }),
  ]);

  // "van" draagt het onderdeel over waarvandaan Beheer geopend werd, zodat de
  // navigatie (zijnav/tabbalk) daarbinnen kan blijven wijzen.
  const herkomstOnderdeel = departments.find((d) => d.id === params.van) ?? null;

  return (
    <AppShell department={herkomstOnderdeel} isDutyManager={true}>
      <TopBar userNaam={session.user.naam} userRoleLabel={ROLE_LABELS[session.user.role]}>
        <p className="font-display text-[15px] font-extrabold italic uppercase tracking-[0.04em] text-ink">
          Beheer
        </p>
      </TopBar>
      <div className="px-[18px] pb-8 pt-6 desktop:px-6">
        <h1 className="text-[22px] text-ink desktop:hidden">Beheer</h1>
        <p className="mb-4 mt-0.5 text-[13px] text-text-muted desktop:hidden">
          Alleen zichtbaar voor beheerders.
        </p>

        <h2 className="font-display mb-2 mt-5 text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-ink first:mt-0">
          Excel
        </h2>
        <div className="rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap gap-2.5">
            <ImportForm />
            <a
              href="/api/export"
              className="flex h-fit items-center gap-1.5 rounded-full border border-ink px-4 py-2 text-[13px] font-bold uppercase tracking-[0.03em] text-ink transition-colors hover:bg-card-border"
            >
              <Upload size={15} strokeWidth={2} />
              Exporteren
            </a>
          </div>
          {params.error && (
            <p className="mt-3 rounded-lg bg-red-tint px-3 py-2 text-[12.5px] text-red">
              {params.error}
            </p>
          )}
          {params.ok && (
            <p className="mt-3 rounded-lg bg-green-tint px-3 py-2 text-[12.5px] text-green-text">
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

        <h2 className="font-display mb-2 mt-5 text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-ink">
          Onderdelen &amp; categorieen
        </h2>
        <CategoryManager departments={departments} />

        <h2 className="font-display mb-2 mt-5 text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-ink">
          Medewerkers
        </h2>
        <UserManager users={users} currentUserId={session.user.id} />
      </div>
    </AppShell>
  );
}

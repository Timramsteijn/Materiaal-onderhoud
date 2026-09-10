import { prisma } from "@/lib/prisma";
import { NewMaterialForm } from "./new-material-form";

export default async function NieuwMateriaalPage({
  params,
  searchParams,
}: {
  params: Promise<{ departmentId: string }>;
  searchParams: Promise<{ categorie?: string; id?: string }>;
}) {
  const { departmentId } = await params;
  const { categorie, id } = await searchParams;
  const categories = await prisma.category.findMany({
    where: { departmentId },
    orderBy: { naam: "asc" },
  });

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-4 text-xl text-ink">Nieuw materiaal</h1>
      {categories.length === 0 ? (
        <p className="text-ink-soft">
          Er zijn nog geen categorieen in dit onderdeel. Vraag een duty manager om er
          eerst een aan te maken via Beheer.
        </p>
      ) : (
        <NewMaterialForm
          departmentId={departmentId}
          categories={categories}
          initialCategoryId={categorie}
          initialId={id}
        />
      )}
    </div>
  );
}

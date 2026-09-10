import { prisma } from "@/lib/prisma";
import { generateQrDataUrl } from "@/lib/qr";
import { PrintButton } from "@/components/print-button";

export default async function PrintSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; ids?: string }>;
}) {
  const { categorie, ids } = await searchParams;
  const idList = ids ? ids.split(",").map((v) => v.trim()).filter(Boolean) : undefined;

  const materialen = await prisma.material.findMany({
    where: {
      categoryId: categorie || undefined,
      id: idList ? { in: idList } : undefined,
    },
    orderBy: { id: "asc" },
  });

  const labels = await Promise.all(
    materialen.map(async (m) => ({
      material: m,
      qrDataUrl: await generateQrDataUrl(m.id),
    }))
  );

  return (
    <div className="px-4 pt-4">
      <div className="no-print mb-4 flex items-center justify-between">
        <p className="text-[13px] text-ink-soft">{labels.length} labels op dit printvel</p>
        <PrintButton />
      </div>

      {labels.length === 0 ? (
        <p className="text-ink-soft">Geen materiaal gevonden voor dit printvel.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 print:grid-cols-3">
          {labels.map(({ material, qrDataUrl }) => (
            <div
              key={material.id}
              className="flex flex-col items-center break-inside-avoid rounded-lg border border-dashed border-border p-2 text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt={material.id} width={90} height={90} />
              <p className="label-font mt-1 text-[13px] font-bold text-ink">{material.id}</p>
              <p className="text-[9.5px] text-ink-soft">
                {material.merk} {material.model}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

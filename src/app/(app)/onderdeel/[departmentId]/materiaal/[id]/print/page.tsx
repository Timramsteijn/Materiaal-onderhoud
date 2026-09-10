import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateQrDataUrl } from "@/lib/qr";
import { PrintButton } from "@/components/print-button";

export default async function PrintMaterialLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const materialId = decodeURIComponent(id);
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) notFound();

  const qrDataUrl = await generateQrDataUrl(material.id);

  return (
    <div className="px-4 pt-4">
      <div className="no-print mb-4">
        <PrintButton />
      </div>
      <div className="mx-auto flex w-[200px] flex-col items-center rounded-lg border border-dashed border-border p-4 text-center">
        <Image src={qrDataUrl} alt={material.id} width={160} height={160} unoptimized />
        <p className="label-font mt-2 text-base font-bold text-ink">{material.id}</p>
        <p className="text-[11px] text-ink-soft">
          {material.merk} {material.model}
        </p>
      </div>
    </div>
  );
}

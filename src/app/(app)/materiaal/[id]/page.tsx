import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canDeleteMaterial, canSetOutOfService } from "@/lib/permissions";
import { generateQrDataUrl } from "@/lib/qr";
import { StatusBadge } from "@/components/status-badge";
import { LogForm } from "./log-form";
import { EditMaterialForm } from "./edit-form";
import { DeleteMaterialButton } from "./delete-button";

export default async function MateriaalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const materialId = decodeURIComponent(id);

  const [session, material] = await Promise.all([
    auth(),
    prisma.material.findUnique({
      where: { id: materialId },
      include: {
        category: true,
        logs: {
          orderBy: { datum: "desc" },
          take: 10,
          include: { uitgevoerdDoor: { select: { naam: true } } },
        },
      },
    }),
  ]);

  if (!material) notFound();
  const role = session!.user.role;
  const qrDataUrl = await generateQrDataUrl(material.id);

  return (
    <div className="px-4 pt-4 pb-4">
      <Link href="/materiaal" className="text-[13px] text-ink-soft">
        ← Terug naar materiaal
      </Link>

      <div className="mt-3 flex items-center justify-between rounded-2xl bg-panel p-4 shadow-sm">
        <div>
          <p className="label-font text-lg text-ink">{material.id}</p>
          <p className="text-[13px] text-ink-soft">
            {material.category.naam} · {material.merk} {material.model}
            {material.maat ? ` · ${material.maat}` : ""}
          </p>
          {material.opmerkingen && (
            <p className="mt-1 text-[12.5px] italic text-ink-soft">{material.opmerkingen}</p>
          )}
        </div>
        <StatusBadge status={material.status} />
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-panel p-4 shadow-sm">
        <Image
          src={qrDataUrl}
          alt={`QR-code voor ${material.id}`}
          width={72}
          height={72}
          className="rounded-lg border border-border"
          unoptimized
        />
        <div className="flex-1">
          <p className="text-[13px] text-ink-soft">QR-code voor dit materiaal</p>
          <Link
            href={`/materiaal/${encodeURIComponent(material.id)}/print`}
            className="mt-1 inline-block text-[13px] font-semibold text-ice-dark"
          >
            Printen →
          </Link>
        </div>
      </div>

      <div className="mt-3">
        <LogForm
          materialId={material.id}
          acties={material.category.acties}
          huidigeStatus={material.status}
          magAfkeuren={canSetOutOfService(role)}
        />
      </div>

      <div className="mt-3">
        <EditMaterialForm material={material} magAfkeuren={canSetOutOfService(role)} />
      </div>

      {canDeleteMaterial(role) && <DeleteMaterialButton materialId={material.id} />}

      <h2 className="mb-2 mt-5 text-[15px] text-ink">Recente onderhoudshistorie</h2>
      {material.logs.length === 0 ? (
        <p className="text-[13px] text-ink-soft">Nog geen onderhoud geregistreerd.</p>
      ) : (
        <ul className="space-y-2">
          {material.logs.map((log) => (
            <li key={log.id} className="rounded-xl bg-panel p-3 shadow-sm">
              <p className="text-[13.5px] font-medium text-ink">{log.actie}</p>
              <p className="text-[12px] text-ink-soft">
                {log.datum.toLocaleDateString("nl-NL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {log.uitgevoerdDoor.naam}
              </p>
              {log.opmerkingen && (
                <p className="mt-1 text-[12.5px] italic text-ink-soft">{log.opmerkingen}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

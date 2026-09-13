import Link from "next/link";
import Image from "next/image";
import { generateQrDataUrl } from "@/lib/qr";
import { StatusBadge } from "@/components/status-badge";
import { LogForm } from "./log-form";
import { EditMaterialForm } from "./edit-form";
import { DeleteMaterialButton } from "./delete-button";
import { ChevronLeft, Printer } from "@/components/icons";
import { canDeleteMaterial, canSetOutOfService } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type MaterialMetVerband = {
  id: string;
  merk: string;
  model: string;
  maat: string | null;
  aanschafjaar: number | null;
  status: "IN_GEBRUIK" | "IN_REPARATIE" | "BUITEN_GEBRUIK";
  opmerkingen: string | null;
  locatie: string | null;
  inGebruikSinds: Date | null;
  extraVeldWaarde: string | null;
  category: { naam: string; acties: string[]; extraVeldLabel: string | null };
  _count: { logs: number };
  logs: Array<{
    id: string;
    actie: string;
    datum: Date;
    opmerkingen: string | null;
    uitgevoerdDoor: { naam: string };
  }>;
};

function formatDatum(d: Date): string {
  return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-bg py-2.5 last:border-b-0">
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-dark-secondary">
        {label}
      </span>
      <span className="text-right text-[13.5px] text-ink">{value}</span>
    </div>
  );
}

export async function MaterialDetail({
  material,
  role,
  base,
  userNaam,
  backHref,
}: {
  material: MaterialMetVerband;
  role: Role;
  base: string;
  userNaam: string;
  backHref: string;
}) {
  const qrDataUrl = await generateQrDataUrl(material.id);
  const laatsteGrootOnderhoud = material.logs[0]?.datum ?? null;

  return (
    <div className="px-[18px] pb-8 pt-4 desktop:px-6 desktop:pt-6">
      <Link
        href={backHref}
        prefetch={false}
        className="mb-3 flex items-center gap-1 text-[13px] text-steel desktop:hidden"
      >
        <ChevronLeft size={16} strokeWidth={2} />
        Terug naar materiaal
      </Link>

      <div className="flex items-start justify-between gap-4 rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="min-w-0">
          <p className="font-display text-[26px] font-extrabold italic text-ink">{material.id}</p>
          <p className="mt-0.5 text-[14px] text-text-medium">
            {material.merk} {material.model}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-steel-tint px-2.5 py-1 text-[11px] font-semibold text-steel-dark">
              {material.category.naam}
            </span>
            <StatusBadge status={material.status} />
          </div>
        </div>
        <div className="shrink-0 text-center">
          <div className="flex h-[78px] w-[78px] items-center justify-center rounded-[10px] bg-ink p-1.5">
            <Image
              src={qrDataUrl}
              alt={`QR-code voor ${material.id}`}
              width={72}
              height={72}
              unoptimized
            />
          </div>
          <Link
            href={`${base}/materiaal/${encodeURIComponent(material.id)}/print`}
            className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-steel-dark"
          >
            <Printer size={13} strokeWidth={2} />
            printen
          </Link>
        </div>
      </div>

      <div className="mt-3 rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)] desktop:grid desktop:grid-cols-2 desktop:gap-x-8">
        <SpecRow label="Categorie" value={material.category.naam} />
        <SpecRow label="Merk / model" value={`${material.merk} ${material.model}`} />
        {material.maat && <SpecRow label="Maat" value={material.maat} />}
        {material.category.extraVeldLabel && material.extraVeldWaarde && (
          <SpecRow label={material.category.extraVeldLabel} value={material.extraVeldWaarde} />
        )}
        {material.locatie && <SpecRow label="Locatie" value={material.locatie} />}
        {material.inGebruikSinds && (
          <SpecRow label="In gebruik sinds" value={formatDatum(material.inGebruikSinds)} />
        )}
        <SpecRow
          label="Laatste groot onderhoud"
          value={laatsteGrootOnderhoud ? formatDatum(laatsteGrootOnderhoud) : "Nog niet"}
        />
        <SpecRow label="Onderhoudsbeurten" value={String(material._count.logs)} />
      </div>
      {material.opmerkingen && (
        <p className="mt-2 text-[12.5px] italic text-text-muted">{material.opmerkingen}</p>
      )}

      <div className="mt-3 desktop:flex desktop:items-start desktop:gap-4">
        <LogForm
          materialId={material.id}
          acties={material.category.acties}
          magAfkeuren={canSetOutOfService(role)}
          userNaam={userNaam}
        />

        <div className="mt-3 rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)] desktop:mt-0 desktop:w-[300px] desktop:shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[13px] font-extrabold uppercase italic tracking-[0.06em] text-ink">
              Historie
            </h2>
            {material._count.logs > material.logs.length && (
              <Link
                href={`${base}/log?materiaal=${encodeURIComponent(material.id)}`}
                className="text-[11.5px] text-steel-dark"
              >
                alles zien ({material._count.logs})
              </Link>
            )}
          </div>
          {material.logs.length === 0 ? (
            <p className="mt-2 text-[13px] text-text-muted">Nog geen onderhoud geregistreerd.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {material.logs.map((log) => (
                <li key={log.id} className="relative border-l-2 border-bg pb-1 pl-3.5">
                  <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-orange" />
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-[14px] font-extrabold italic text-ink">
                      {log.actie}
                    </p>
                    <p className="shrink-0 text-[12px] text-text-dark-secondary">
                      {formatDatum(log.datum)}
                    </p>
                  </div>
                  <p className="text-[12.5px] text-text-muted">{log.uitgevoerdDoor.naam}</p>
                  {log.opmerkingen && (
                    <p className="mt-0.5 text-[13px] text-text-medium">&ldquo;{log.opmerkingen}&rdquo;</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-3">
        <EditMaterialForm
          material={material}
          extraVeldLabel={material.category.extraVeldLabel}
          magAfkeuren={canSetOutOfService(role)}
        />
      </div>

      {canDeleteMaterial(role) && (
        <div className="mt-3">
          <DeleteMaterialButton materialId={material.id} />
        </div>
      )}
    </div>
  );
}

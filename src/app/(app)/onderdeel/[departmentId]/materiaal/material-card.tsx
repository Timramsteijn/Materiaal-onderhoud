import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";

export type MaterialListItem = {
  id: string;
  merk: string;
  model: string;
  locatie: string | null;
  category: { naam: string };
  status: "IN_GEBRUIK" | "IN_REPARATIE" | "BUITEN_GEBRUIK";
  logs: Array<{ datum: Date }>;
};

function metaRegel(m: MaterialListItem): string {
  const delen = [
    m.locatie,
    m.logs[0]
      ? `laatste onderhoud ${m.logs[0].datum.toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}`
      : "nog geen onderhoud",
  ].filter(Boolean);
  return delen.join(" · ");
}

export function MaterialCard({
  material,
  href,
  active,
}: {
  material: MaterialListItem;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`flex items-center justify-between gap-3 rounded-[10px] border bg-card p-3.5 shadow-[var(--shadow-card-light)] transition-shadow hover:shadow-[var(--shadow-card-hover)] ${
        active ? "border-orange" : "border-card-border"
      }`}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-1.5">
          <span className="font-display text-[16px] font-extrabold italic text-ink">
            {material.id}
          </span>
          <span className="rounded-full bg-steel-tint px-2 py-0.5 text-[10px] font-semibold text-steel-dark">
            {material.category.naam}
          </span>
        </p>
        <p className="truncate text-[13.5px] text-text-medium">
          {material.merk} {material.model}
        </p>
        <p className="truncate text-[12px] text-text-dark-secondary">{metaRegel(material)}</p>
      </div>
      <StatusBadge status={material.status} />
    </Link>
  );
}

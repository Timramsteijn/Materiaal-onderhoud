import { STATUS_LABELS } from "@/lib/domain";
import type { MaterialStatus } from "@prisma/client";

const STYLES: Record<MaterialStatus, string> = {
  IN_GEBRUIK: "bg-good-bg text-good",
  IN_REPARATIE: "bg-amber/15 text-amber-dark",
  BUITEN_GEBRUIK: "bg-danger-bg text-danger",
};

export function StatusBadge({ status }: { status: MaterialStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

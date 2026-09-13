import { STATUS_LABELS } from "@/lib/domain";
import type { MaterialStatus } from "@prisma/client";

const STYLES: Record<MaterialStatus, string> = {
  IN_GEBRUIK: "bg-green-tint text-green-text",
  IN_REPARATIE: "bg-orange-tint text-orange-hover",
  BUITEN_GEBRUIK: "bg-red-tint text-red",
};

export function StatusBadge({ status }: { status: MaterialStatus }) {
  return (
    <span
      className={`font-display shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase italic ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

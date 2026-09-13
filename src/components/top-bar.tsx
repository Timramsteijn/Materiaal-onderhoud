import type { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";

export function TopBar({
  userNaam,
  userRoleLabel,
  children,
}: {
  userNaam: string;
  userRoleLabel: string;
  children?: ReactNode;
}) {
  return (
    <div className="no-print hidden h-[66px] items-center justify-between border-b border-border-light bg-card px-6 desktop:flex">
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      <div className="flex shrink-0 items-center gap-3 pl-4">
        <div className="text-right">
          <p className="text-[13.5px] font-medium text-ink">{userNaam}</p>
          <p className="text-[11px] text-text-muted">{userRoleLabel}</p>
        </div>
        <LogoutButton variant="light" />
      </div>
    </div>
  );
}

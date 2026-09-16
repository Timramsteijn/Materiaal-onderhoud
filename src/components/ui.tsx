import type { ReactNode } from "react";
import Link from "next/link";
import { STATUS_LABELS, STATUS_STIJL } from "@/lib/domain";
import type { Status } from "@prisma/client";

/** Status is een globale toestand en kleurt dus nooit mee met het onderdeel. */
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] ${STATUS_STIJL[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function CategorieBadge({ naam }: { naam: string }) {
  return (
    <span className="shrink-0 rounded-full bg-neutral-fill px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-text-medium">
      {naam}
    </span>
  );
}

export function Kaart({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-border-light bg-creme p-4 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

export function KaartTitel({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-body text-[12px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
      {children}
    </h2>
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted"
    >
      {children}
    </label>
  );
}

export const inputClass =
  "h-12 w-full rounded-input border border-border-light bg-creme px-3.5 text-[15px] text-ink placeholder:text-text-muted";

/** Primaire actie: altijd een volledig ronde pill in de accentkleur. */
export function PrimaireKnop({
  children,
  type = "submit",
  disabled,
  className = "",
}: {
  children: ReactNode;
  type?: "submit" | "button";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`motion lift flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-accent px-6 text-[14px] font-extrabold uppercase tracking-[0.08em] text-accent-on hover:bg-accent-pressed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function OutlineKnop({
  children,
  href,
  onClick,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "submit" | "button";
  className?: string;
}) {
  const stijl = `motion flex min-h-[44px] items-center justify-center gap-2 rounded-full border-[1.5px] border-ink px-5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-ink hover:bg-neutral-fill ${className}`;
  if (href) {
    return (
      <Link href={href} prefetch={false} className={stijl}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={stijl}>
      {children}
    </button>
  );
}

/** Filter- en keuzepil; actief = inkt met accenttekst, zoals in het ontwerp. */
export function Pill({
  children,
  actief,
  href,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  actief: boolean;
  href?: string;
  onClick?: () => void;
  type?: "submit" | "button";
}) {
  const stijl = `motion shrink-0 rounded-full border-[1.5px] px-3.5 py-2 text-[11.5px] font-extrabold uppercase tracking-[0.08em] ${
    actief
      ? "border-ink bg-ink text-accent"
      : "border-border-light bg-creme text-text-medium hover:border-accent"
  }`;
  if (href) {
    return (
      <Link href={href} prefetch={false} className={stijl}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={stijl}>
      {children}
    </button>
  );
}

/** Lege toestand: altijd benoemd, altijd met een uitweg. */
export function LegeToestand({
  icoon,
  kop,
  uitleg,
  acties,
}: {
  icoon: ReactNode;
  kop: string;
  uitleg: ReactNode;
  acties?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-border-light bg-creme px-6 py-10 text-center shadow-[var(--shadow-light)]">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center text-text-muted">
        {icoon}
      </div>
      <p className="display text-[17px] text-ink">{kop}</p>
      <p className="mx-auto mt-1 max-w-[42ch] text-[13px] text-text-muted">{uitleg}</p>
      {acties && <div className="mt-4 flex flex-wrap justify-center gap-2.5">{acties}</div>}
    </div>
  );
}

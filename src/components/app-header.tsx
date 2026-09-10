import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export function AppHeader({
  department,
}: {
  department?: { id: string; naam: string } | null;
}) {
  return (
    <header className="flex items-center justify-between bg-graphite px-4 py-3.5 text-white">
      <div>
        <p className="label-font text-[15px] leading-tight">Materiaalonderhoud</p>
        {department ? (
          <Link
            href="/onderdeel"
            className="mt-0.5 flex items-center gap-1 text-[11.5px] font-medium text-white/65"
          >
            {department.naam}
            <svg width="10" height="10" viewBox="0 0 10 10" className="opacity-60">
              <path
                d="M2.5 3.5 L5 6.5 L7.5 3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ) : null}
      </div>
      <LogoutButton />
    </header>
  );
}

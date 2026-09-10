import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/domain";
import { BottomNav } from "@/components/bottom-nav";
import { LogoutButton } from "@/components/logout-button";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isDutyManager = session.user.role === "DUTY_MANAGER";

  return (
    <div className="mx-auto flex min-h-full max-w-[560px] flex-col bg-bg">
      <header className="flex items-center justify-between bg-graphite px-4 py-3.5 text-white">
        <div>
          <p className="label-font text-[15px] leading-tight">Materiaalonderhoud</p>
          <p className="text-[11.5px] text-white/60">
            {session.user.naam} · {ROLE_LABELS[session.user.role]}
          </p>
        </div>
        <LogoutButton />
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <BottomNav isDutyManager={isDutyManager} />
    </div>
  );
}

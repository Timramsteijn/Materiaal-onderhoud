import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto min-h-full max-w-[560px] bg-bg desktop:mx-0 desktop:max-w-none">
      {children}
    </div>
  );
}

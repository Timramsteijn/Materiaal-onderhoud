import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/inloggen");
  }

  return (
    <div className="mx-auto min-h-full max-w-[560px] bg-zand desktop:mx-0 desktop:max-w-none">
      {children}
    </div>
  );
}

import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

export default async function DepartmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ departmentId: string }>;
}) {
  const { departmentId } = await params;
  const [session, department] = await Promise.all([
    auth(),
    prisma.department.findUnique({ where: { id: departmentId } }),
  ]);
  if (!department) notFound();

  const isDutyManager = session!.user.role === "DUTY_MANAGER";

  return (
    <>
      <AppHeader department={department} />
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav isDutyManager={isDutyManager} departmentId={department.id} />
    </>
  );
}

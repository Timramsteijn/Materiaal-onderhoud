import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

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
    <AppShell department={department} isDutyManager={isDutyManager}>
      {children}
    </AppShell>
  );
}

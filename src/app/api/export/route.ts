import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildExportWorkbook } from "@/lib/excel";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Niet ingelogd.", { status: 401 });
  }

  const [materialen, logs] = await Promise.all([
    prisma.material.findMany({
      include: { category: { include: { department: true } } },
      orderBy: { id: "asc" },
    }),
    prisma.maintenanceLog.findMany({
      include: {
        material: {
          select: {
            id: true,
            category: { select: { naam: true, department: { select: { naam: true } } } },
          },
        },
        uitgevoerdDoor: { select: { naam: true } },
      },
    }),
  ]);

  const buffer = buildExportWorkbook(materialen, logs);
  const datum = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Onderhoud_Materiaal_${datum}.xlsx"`,
    },
  });
}

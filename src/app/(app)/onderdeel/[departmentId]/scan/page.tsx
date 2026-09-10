import { ScanView } from "./scan-view";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ departmentId: string }>;
}) {
  const { departmentId } = await params;
  return <ScanView departmentId={departmentId} />;
}

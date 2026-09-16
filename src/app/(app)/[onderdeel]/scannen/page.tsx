import { auth } from "@/lib/auth";
import { getOnderdeel } from "@/lib/onderdeel";
import { TopBar } from "@/components/top-bar";
import { ScanView } from "./scan-view";

export default async function ScannenPage({
  params,
}: {
  params: Promise<{ onderdeel: string }>;
}) {
  const { onderdeel: slug } = await params;
  const [session, onderdeel] = await Promise.all([auth(), getOnderdeel(slug)]);

  return (
    <>
      <TopBar
        titel="Scannen"
        subregel="Houd de QR-sticker voor de camera of typ het Materiaal-ID"
        medewerkerNaam={session!.user.naam}
        functie={session!.user.functie}
      />
      <ScanView slug={slug} onderdeelId={onderdeel.id} onderdeelNaam={onderdeel.naam} />
    </>
  );
}

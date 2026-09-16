import { auth } from "@/lib/auth";
import { getOnderdeel } from "@/lib/onderdeel";
import { accentStyle } from "@/lib/accent";
import { isBeheerder } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";

export default async function OnderdeelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ onderdeel: string }>;
}) {
  const { onderdeel: slug } = await params;
  const [session, onderdeel] = await Promise.all([auth(), getOnderdeel(slug)]);

  return (
    <div style={accentStyle(onderdeel)} className="min-h-full">
      <AppShell
        slug={onderdeel.slug}
        onderdeelNaam={onderdeel.naam}
        isBeheerder={isBeheerder(session!.user.rol)}
      >
        {children}
      </AppShell>
    </div>
  );
}

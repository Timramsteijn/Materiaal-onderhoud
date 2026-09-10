import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/onderdeel");
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-bg px-5 py-10">
      <div className="w-full max-w-[360px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-graphite text-2xl">
            🛠️
          </div>
          <h1 className="text-xl text-ink">Materiaalonderhoud</h1>
          <p className="mt-1 text-sm text-ink-soft">Outdoor Valley — inloggen</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

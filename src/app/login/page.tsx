import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { Triangle } from "@/components/icons";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/onderdeel");
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-ink px-8">
      <div className="w-full max-w-[360px]">
        <div className="mb-8">
          <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-xl border-2 border-orange">
            <Triangle size={24} strokeWidth={2} className="text-orange" />
          </div>
          <h1 className="font-display text-[30px] font-extrabold italic leading-[1.1] text-white">
            Materiaal
            <br />
            Onderhoud
          </h1>
          <p className="mt-2 text-[13px] text-text-dark-secondary">
            Outdoor Valley · verhuurmateriaal
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const gebruikersnaam = formData.get("gebruikersnaam");
  const wachtwoord = formData.get("wachtwoord");

  try {
    await signIn("credentials", {
      gebruikersnaam,
      wachtwoord,
      redirectTo: "/onderdeel",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Onjuiste gebruikersnaam of wachtwoord." };
    }
    throw err;
  }
}

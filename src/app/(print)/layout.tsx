import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import "./print.css";

/**
 * Printweergaven staan buiten de app-chrome: geen zijnav, geen tabbalk, geen
 * topbalk. Deze layout doet alleen de auth-gate; de rest van het beeld is het
 * vel zelf.
 */
export default async function PrintLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/inloggen");
  }

  return <div className="min-h-full bg-zand">{children}</div>;
}

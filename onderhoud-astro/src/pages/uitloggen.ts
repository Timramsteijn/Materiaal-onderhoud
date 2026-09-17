import type { APIRoute } from "astro";
import { uitloggen } from "@/lib/auth";

/** Alleen POST: uitloggen mag nooit per ongeluk via een link gebeuren. */
export const POST: APIRoute = ({ session, redirect }) => {
  uitloggen(session);
  return redirect("/inloggen", 303);
};

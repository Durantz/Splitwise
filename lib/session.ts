import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Restituisce la sessione o redirige al login. Da usare nei server.ts e nelle page. */
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function getSession() {
  return getServerSession(authOptions);
}

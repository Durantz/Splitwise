import { requireSession } from "@/lib/session";
import AppShellClient from "@/components/AppShellClient";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return <AppShellClient user={session.user}>{children}</AppShellClient>;
}

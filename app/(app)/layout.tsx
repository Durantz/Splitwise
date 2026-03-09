import { requireSession } from "@/lib/session";
import AppNav from "@/components/AppNav";
import AppShellLayout from "@/components/AppShellLayout";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <AppShellLayout navbar={<AppNav user={session.user} />}>
      {children}
    </AppShellLayout>
  );
}

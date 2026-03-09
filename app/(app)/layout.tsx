import { AppShell, AppShellNavbar, AppShellMain } from "@mantine/core";
import { requireSession } from "@/lib/session";
import AppNav from "@/components/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <AppShell navbar={{ width: 220, breakpoint: "sm" }} padding="md">
      <AppShellNavbar p="md">
        <AppNav user={session.user} />
      </AppShellNavbar>
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}

"use client";

import { AppShell, AppShellNavbar, AppShellMain } from "@mantine/core";

interface Props {
  navbar: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShellLayout({ navbar, children }: Props) {
  return (
    <AppShell navbar={{ width: 220, breakpoint: "sm" }} padding="md">
      <AppShellNavbar p="md">{navbar}</AppShellNavbar>
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}

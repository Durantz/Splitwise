"use client";

import { AppShell, Burger, Group, Text, Box, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import AppNav from "@/components/AppNav";

interface Props {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  children: React.ReactNode;
}

export default function AppShellClient({ user, children }: Props) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const pathname = usePathname();

  // Chiude il menu ad ogni cambio di pagina
  useEffect(() => {
    close();
  }, [pathname]);

  return (
    <AppShell
      navbar={{
        width: 220,
        breakpoint: "sm",
        collapsed: { mobile: !opened, desktop: false },
      }}
      header={{ height: 50 }}
      padding="md"
    >
      <AppShell.Header zIndex={200}>
        <Group h="100%" px="md" gap="sm">
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
          <Box
            w={22}
            h={22}
            style={{
              borderRadius: 6,
              background: "var(--mantine-color-dark-6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}
          >
            💸
          </Box>
          <Text fw={700} size="sm">
            Split
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="md"
        zIndex={100}
        // style={opened ? { top: 0, left: 0, transform: "none" } : undefined}
      >
        <AppNav user={user} />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

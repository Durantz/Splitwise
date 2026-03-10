"use client";

import { AppShell, Burger, Group, Text, Box, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import AppNav from "@/components/AppNav";
import Image from "next/image";

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
          <Image
            src="/web-app-manifest-192x192.png"
            alt="Splitwise"
            width={22}
            height={22}
          />
          <Text fw={700} size="sm">
            Splitwise
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" zIndex={100}>
        <AppNav user={user} />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

"use client";

import { Stack, NavLink, Avatar, Text, Group, Divider, UnstyledButton, Box } from "@mantine/core";
import { IconLayoutDashboard, IconReceipt, IconUsers, IconLogout } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface AppNavProps {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
}

const links = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/expenses", label: "Spese",     icon: IconReceipt },
  { href: "/groups",   label: "Gruppi",    icon: IconUsers },
];

export default function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();

  return (
    <Stack h="100%" justify="space-between">
      {/* Brand */}
      <Stack gap={0}>
        <Group gap="xs" mb="lg" px="xs">
          <Box
            w={28} h={28}
            style={{ borderRadius: 8, background: "var(--mantine-color-dark-6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}
          >
            💸
          </Box>
          <Text fw={700} size="sm">Split</Text>
        </Group>

        <Stack gap={2}>
          {links.map(({ href, label, icon: Icon }) => (
            <NavLink
              key={href}
              component={Link}
              href={href}
              label={label}
              leftSection={<Icon size={16} stroke={1.5} />}
              active={pathname.startsWith(href)}
              styles={{ root: { borderRadius: "var(--mantine-radius-md)" } }}
            />
          ))}
        </Stack>
      </Stack>

      {/* User + logout */}
      <Stack gap="xs">
        <Divider />
        <Group gap="xs" px="xs">
          <Avatar src={user.image} size={28} radius="xl" name={user.name ?? undefined} />
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" fw={500} truncate>{user.name}</Text>
            <Text size="xs" c="dimmed" truncate>{user.email}</Text>
          </Box>
        </Group>
        <NavLink
          label="Esci"
          leftSection={<IconLogout size={16} stroke={1.5} />}
          onClick={() => signOut({ callbackUrl: "/login" })}
          styles={{ root: { borderRadius: "var(--mantine-radius-md)" } }}
          c="red"
        />
      </Stack>
    </Stack>
  );
}

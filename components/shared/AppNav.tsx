"use client";

import { Stack, NavLink, Avatar, Text, Group, Box, Divider, UnstyledButton } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconReceipt,
  IconUsers,
  IconLogout,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/expenses", label: "Spese", icon: IconReceipt },
  { href: "/groups", label: "Gruppi", icon: IconUsers },
];

interface AppNavProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();

  return (
    <Stack h="100%" justify="space-between">
      {/* Brand */}
      <Stack gap="xs">
        <Group gap="xs" mb="lg" px={4}>
          <Box
            w={28} h={28}
            style={{ borderRadius: 8, background: "var(--mantine-color-dark-8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
          >
            💸
          </Box>
          <Text fw={600} size="sm">Split</Text>
        </Group>

        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <NavLink
              key={href}
              component={Link}
              href={href}
              label={label}
              leftSection={<Icon size={16} stroke={1.75} />}
              active={active}
              color="dark"
              variant={active ? "light" : "subtle"}
              styles={{ label: { fontWeight: active ? 500 : 400, fontSize: 14 } }}
            />
          );
        })}
      </Stack>

      {/* User footer */}
      <Box>
        <Divider mb="md" />
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" style={{ overflow: "hidden" }}>
            <Avatar src={user.image} size={30} radius="xl" />
            <Box style={{ overflow: "hidden" }}>
              <Text size="xs" fw={500} truncate>{user.name}</Text>
            </Box>
          </Group>
          <UnstyledButton
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Esci"
            style={{ color: "var(--mantine-color-gray-5)", flexShrink: 0 }}
          >
            <IconLogout size={15} />
          </UnstyledButton>
        </Group>
      </Box>
    </Stack>
  );
}

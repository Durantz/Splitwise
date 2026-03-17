"use client";

import {
  Stack,
  NavLink,
  Avatar,
  Text,
  Group,
  Divider,
  Box,
} from "@mantine/core";
import {
  IconLayoutDashboard,
  IconReceipt,
  IconUsers,
  IconLogout,
  IconShieldCheck,
  IconShoppingCart,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import NotificationToggle from "./NotificationToggle";
import { IconChartBar } from "@tabler/icons-react";

interface AppNavProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const links = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/expenses", label: "Spese", icon: IconReceipt },
  { href: "/groups", label: "Gruppi", icon: IconUsers },
  { href: "/budget", label: "Budget", icon: IconChartBar }, // <- aggiungi
  { href: "/grocery", label: "Spesa", icon: IconShoppingCart },
];
export default function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();
  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  return (
    <Stack justify="space-between" style={{ minHeight: "100%" }}>
      {/* Brand */}
      <Stack gap={0}>
        {/* <Group gap="xs" mb="lg" px="xs">
          <Box
            w={28}
            h={28}
            style={{
              borderRadius: 8,
              background: "var(--mantine-color-dark-6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            💸
          </Box>
          <Text fw={700} size="sm">
            Split
          </Text>
        </Group> */}

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

          {isAdmin && (
            <NavLink
              component={Link}
              href="/admin/users"
              label="Utenti"
              leftSection={<IconShieldCheck size={16} stroke={1.5} />}
              active={pathname.startsWith("/admin")}
              styles={{ root: { borderRadius: "var(--mantine-radius-md)" } }}
            />
          )}
        </Stack>
      </Stack>

      {/* User + logout */}
      <Stack gap="xs">
        <Divider />
        <Group gap="xs" px="xs">
          <Avatar
            src={user.image}
            size={28}
            radius="xl"
            name={user.name ?? undefined}
          />
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" fw={500} truncate>
              {user.name}
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {user.email}
            </Text>
          </Box>
          <NotificationToggle />
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

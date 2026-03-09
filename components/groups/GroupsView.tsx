"use client";

import {
  Stack, Title, Text, Card, Group, Avatar, AvatarGroup,
  Button, Anchor, Badge, Alert,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import type { GroupDTO } from "@/types";

interface Props {
  groups: GroupDTO[];
  currentUserId: string;
}

export default function GroupsView({ groups, currentUserId }: Props) {
  if (groups.length === 0) {
    return (
      <Stack maw={720} mx="auto" p="md" gap="lg">
        <Group justify="space-between">
          <Title order={2} fw={600}>Gruppi</Title>
          <Button component={Link} href="/groups/new" leftSection={<IconPlus size={16} />} size="sm">
            Nuovo gruppo
          </Button>
        </Group>
        <Card p="xl" ta="center">
          <Text size="3xl" mb="sm">👥</Text>
          <Text c="dimmed" size="sm" mb="md">Nessun gruppo ancora.</Text>
          <Button component={Link} href="/groups/new" variant="default" size="sm">
            Crea il primo gruppo
          </Button>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack maw={720} mx="auto" p="md" gap="lg">
      <Group justify="space-between">
        <Title order={2} fw={600}>Gruppi</Title>
        <Button component={Link} href="/groups/new" leftSection={<IconPlus size={16} />} size="sm">
          Nuovo gruppo
        </Button>
      </Group>

      <Stack gap="sm">
        {groups.map((group) => (
          <Card
            key={group.id}
            component={Link}
            href={`/groups/${group.id}`}
            p="md"
            style={{ textDecoration: "none", cursor: "pointer" }}
          >
            <Group justify="space-between">
              <Group gap="md">
                <Text size="xl">{group.emoji}</Text>
                <Stack gap={2}>
                  <Text size="sm" fw={600} c="dark">{group.name}</Text>
                  <Text size="xs" c="dimmed">
                    {group.members.length} {group.members.length === 1 ? "membro" : "membri"}
                    {" · "}{group.currency}
                  </Text>
                </Stack>
              </Group>
              <Group gap="sm">
                <AvatarGroup>
                  {group.members.slice(0, 3).map((m) => (
                    <Avatar key={m.id} src={m.image} size={28} radius="xl" name={m.name} />
                  ))}
                  {group.members.length > 3 && (
                    <Avatar size={28} radius="xl">+{group.members.length - 3}</Avatar>
                  )}
                </AvatarGroup>
                {group.isAdmin && (
                  <Badge size="xs" variant="light" color="dark">Admin</Badge>
                )}
              </Group>
            </Group>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}

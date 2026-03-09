"use client";

import {
  Stack, Title, Group, Text, Avatar, Card, Anchor,
} from "@mantine/core";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import ExpenseList from "@/components/expenses/ExpenseList";
import AddExpenseButton from "@/components/expenses/AddExpenseButton";
import AddMemberButton from "@/components/groups/AddMemberButton";
import type { GroupDTO, ExpenseDTO, DashboardData } from "@/types";

interface Props {
  group: GroupDTO;
  expenses: ExpenseDTO[];
  dashData: DashboardData;
  currentUserId: string;
}

export default function GroupDetailView({ group, expenses, dashData, currentUserId }: Props) {
  return (
    <Stack maw={720} mx="auto" p="md" gap="lg">
      {/* Back + header */}
      <Stack gap={4}>
        <Anchor component={Link} href="/groups" size="xs" c="dimmed">
          ← Gruppi
        </Anchor>
        <Group justify="space-between" align="flex-end">
          <Group gap="sm">
            <Text size="2rem">{group.emoji}</Text>
            <Stack gap={0}>
              <Title order={2} fw={600}>{group.name}</Title>
              <Text size="xs" c="dimmed">{group.currency}</Text>
            </Stack>
          </Group>
          <AddExpenseButton group={group} currentUserId={currentUserId} />
        </Group>
      </Stack>

      {/* Membri */}
      <Card p="md">
        <Group justify="space-between" mb="sm">
          <Text size="sm" fw={600}>Membri</Text>
          {group.isAdmin && <AddMemberButton groupId={group.id} />}
        </Group>
        <Group gap="sm">
          {group.members.map((m) => (
            <Group key={m.id} gap="xs">
              <Avatar src={m.image} size={32} radius="xl" name={m.name} />
              <Text size="xs" fw={500}>{m.id === currentUserId ? "Tu" : m.name}</Text>
            </Group>
          ))}
        </Group>
      </Card>

      {/* Bilancio rapido */}
      {dashData.balances.length > 0 && (
        <Card p="md">
          <Text size="sm" fw={600} mb="sm">Bilancio</Text>
          <Stack gap={6}>
            {dashData.balances.map(({ user, amount }) => (
              <Group key={user.id} justify="space-between">
                <Group gap="xs">
                  <Avatar src={user.image} size={24} radius="xl" name={user.name} />
                  <Text size="sm">{user.name}</Text>
                </Group>
                <Text size="sm" fw={600} c={amount > 0 ? "teal" : "red"} ff="monospace">
                  {amount > 0 ? "+" : ""}{formatCurrency(amount, group.currency)}
                </Text>
              </Group>
            ))}
          </Stack>
        </Card>
      )}

      {/* Spese */}
      <Stack gap="sm">
        <Text size="sm" fw={600}>Spese ({expenses.length})</Text>
        <ExpenseList
          expenses={expenses}
          currentUserId={currentUserId}
          groupId={group.id}
          currency={group.currency}
        />
      </Stack>
    </Stack>
  );
}

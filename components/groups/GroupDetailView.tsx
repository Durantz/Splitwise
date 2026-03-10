"use client";

import {
  Stack,
  Title,
  Group,
  Text,
  Avatar,
  Card,
  Anchor,
  Tabs,
} from "@mantine/core";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import ExpenseList from "@/components/expenses/ExpenseList";
import AddExpenseButton from "@/components/expenses/AddExpenseButton";
import AddRecurringExpenseButton from "@/components/recurring/AddRecurringExpenseButton";
import RecurringExpenseList from "@/components/recurring/RecurringExpenseList";
import AddMemberButton from "@/components/groups/AddMemberButton";
import SettlementsView from "@/components/settlements/SettlementsView";
import SettlementHistoryView from "@/components/settlements/SettlementHistoryView";
import type { GroupDTO, ExpenseDTO, DashboardData, PairBalance } from "@/types";
import type { RecurringExpenseDTO } from "@/app/(app)/recurring/server";
import type { SettlementHistoryEntry } from "@/app/(app)/settlements/server";
import { IconRepeat, IconHistory } from "@tabler/icons-react";

interface Props {
  group: GroupDTO;
  expenses: ExpenseDTO[];
  recurringExpenses: RecurringExpenseDTO[];
  settlementHistory: SettlementHistoryEntry[];
  dashData: DashboardData;
  pairBalances: PairBalance[];
  currentUserId: string;
}

export default function GroupDetailView({
  group,
  expenses,
  recurringExpenses,
  settlementHistory,
  dashData,
  pairBalances,
  currentUserId,
}: Props) {
  const openDebts = pairBalances.filter((p) => p.netAmount < 0).length;
  const activeRecurring = recurringExpenses.filter((r) => r.active).length;

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
              <Title order={2} fw={600}>
                {group.name}
              </Title>
              <Text size="xs" c="dimmed">
                {group.currency}
              </Text>
            </Stack>
          </Group>
          <Group gap="xs">
            <AddExpenseButton group={group} currentUserId={currentUserId} />
          </Group>
        </Group>
      </Stack>

      {/* Membri */}
      <Card p="md">
        <Group justify="space-between" mb="sm">
          <Text size="sm" fw={600}>
            Membri
          </Text>
          {group.isAdmin && <AddMemberButton groupId={group.id} />}
        </Group>
        <Group gap="sm">
          {group.members.map((m) => (
            <Group key={m.id} gap="xs">
              <Avatar src={m.image} size={32} radius="xl" name={m.name} />
              <Text size="xs" fw={500}>
                {m.id === currentUserId ? "Tu" : m.name}
              </Text>
            </Group>
          ))}
        </Group>
      </Card>

      {/* Tab Spese / Ricorrenti / Saldi / Storico */}
      <Tabs defaultValue="expenses" keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab value="expenses">Spese ({expenses.length})</Tabs.Tab>
          <Tabs.Tab value="recurring" leftSection={<IconRepeat size={14} />}>
            Ricorrenti{activeRecurring > 0 ? ` (${activeRecurring})` : ""}
          </Tabs.Tab>
          <Tabs.Tab value="balances" color={openDebts > 0 ? "red" : undefined}>
            Saldi{openDebts > 0 ? ` · ${openDebts} aperto` : ""}
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={14} />}>
            Storico
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="expenses">
          <ExpenseList
            expenses={expenses}
            currentUserId={currentUserId}
            groupId={group.id}
            currency={group.currency}
          />
        </Tabs.Panel>

        <Tabs.Panel value="recurring">
          <Stack gap="md">
            <Group justify="flex-end">
              <AddRecurringExpenseButton
                group={group}
                currentUserId={currentUserId}
              />
            </Group>
            <RecurringExpenseList
              recurring={recurringExpenses}
              groupId={group.id}
              currency={group.currency}
              currentUserId={currentUserId}
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="balances">
          <SettlementsView
            pairs={pairBalances}
            currentUserId={currentUserId}
            group={group}
          />
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <SettlementHistoryView
            entries={settlementHistory}
            currentUserId={currentUserId}
            currency={group.currency}
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

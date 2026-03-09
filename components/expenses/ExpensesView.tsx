"use client";

import { Stack, Title, Group, Alert, Anchor } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";
import ExpenseList from "@/components/expenses/ExpenseList";
import AddExpenseButton from "@/components/expenses/AddExpenseButton";
import GroupSelector from "@/components/dashboard/GroupSelector";
import type { GroupDTO, ExpenseDTO } from "@/types";

interface Props {
  groups: GroupDTO[];
  activeGroup: GroupDTO;
  expenses: ExpenseDTO[];
  currentUserId: string;
}

export default function ExpensesView({ groups, activeGroup, expenses, currentUserId }: Props) {
  return (
    <Stack maw={720} mx="auto" p="md" gap="lg">
      <Group justify="space-between" align="flex-end">
        <Title order={2} fw={600}>Spese</Title>
        <Group gap="sm">
          <GroupSelector groups={groups} activeGroupId={activeGroup.id} />
          <AddExpenseButton group={activeGroup} currentUserId={currentUserId} />
        </Group>
      </Group>

      <ExpenseList
        expenses={expenses}
        currentUserId={currentUserId}
        groupId={activeGroup.id}
        currency={activeGroup.currency}
      />
    </Stack>
  );
}

export function ExpensesEmpty() {
  return (
    <Stack maw={720} mx="auto" p="md" gap="lg">
      <Title order={2} fw={600}>Spese</Title>
      <Alert icon={<IconAlertCircle />} color="gray" title="Nessun gruppo">
        <Anchor component={Link} href="/groups/new" fw={600}>
          Crea un gruppo →
        </Anchor>
      </Alert>
    </Stack>
  );
}

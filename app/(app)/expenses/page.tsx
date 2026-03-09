import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  Alert,
  Anchor,
  Select,
} from "@mantine/core";
import { IconPlus, IconAlertCircle } from "@tabler/icons-react";
import { requireSession } from "@/lib/session";
import { getUserGroups } from "@/app/(app)/groups/server";
import { getExpenses } from "./server";
import ExpenseList from "@/components/expenses/ExpenseList";
import AddExpenseButton from "@/components/expenses/AddExpenseButton";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ groupId?: string }>;
}

export default async function ExpensesPage({ searchParams }: Props) {
  const [session, { groupId }] = await Promise.all([
    requireSession(),
    searchParams,
  ]);
  const groups = await getUserGroups(session.user.id);

  if (groups.length === 0) {
    return (
      <Stack maw={720} mx="auto" p="md">
        <Title order={2} fw={600}>
          Spese
        </Title>
        <Alert icon={<IconAlertCircle />} color="gray" title="Nessun gruppo">
          <Anchor component={Link} href="/groups/new" fw={600}>
            Crea un gruppo →
          </Anchor>
        </Alert>
      </Stack>
    );
  }

  const activeGroupId = groupId ?? groups[0].id;
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];
  const expenses = await getExpenses(activeGroup.id);

  return (
    <Stack maw={720} mx="auto" p="md" gap="lg">
      <Group justify="space-between" align="flex-end">
        <Title order={2} fw={600}>
          Spese
        </Title>
        <Group gap="sm">
          {groups.length > 1 && (
            <Select
              size="xs"
              value={activeGroup.id}
              data={groups.map((g) => ({
                value: g.id,
                label: `${g.emoji} ${g.name}`,
              }))}
              w={160}
            />
          )}
          <AddExpenseButton
            group={activeGroup}
            currentUserId={session.user.id}
          />
        </Group>
      </Group>

      <ExpenseList
        expenses={expenses}
        currentUserId={session.user.id}
        groupId={activeGroup.id}
        currency={activeGroup.currency}
      />
    </Stack>
  );
}

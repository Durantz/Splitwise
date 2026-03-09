"use client";

import {
  Card,
  Group,
  Stack,
  Text,
  Avatar,
  ActionIcon,
  Tooltip,
  Divider,
  Badge,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import type { ExpenseDTO } from "@/types";
import { CATEGORY_META } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteExpense } from "@/app/(app)/expenses/server";

interface Props {
  expense: ExpenseDTO;
  currentUserId: string;
  groupId: string;
  currency: string;
}

export default function ExpenseCard({
  expense,
  currentUserId,
  groupId,
  currency,
}: Props) {
  const iAmPayer = expense.paidBy.id === currentUserId;
  const meta = CATEGORY_META[expense.category];

  // Considera solo gli split di chi non ha pagato (il pagante non deve nulla a se stesso)
  const relevantSplits = expense.splits.filter(
    (s) => s.userId !== expense.paidBy.id
  );
  const allSettled =
    relevantSplits.length > 0 && relevantSplits.every((s) => s.settled);
  const someSettled = !allSettled && relevantSplits.some((s) => s.settled);

  // Data di saldo: la più recente tra gli split saldati
  const settledAt = allSettled
    ? relevantSplits
        .map((s) => s.settledAt)
        .filter(Boolean)
        .sort()
        .at(-1)
    : null;

  async function handleDelete() {
    await deleteExpense(expense.id, groupId);
    notifications.show({ message: "Spesa eliminata", color: "gray" });
  }

  return (
    <Card p="md" radius="md" withBorder>
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Text size="xl" style={{ lineHeight: 1 }}>
              {meta.icon}
            </Text>
            <Stack gap={0}>
              <Text size="sm" fw={600} lineClamp={1}>
                {expense.description}
              </Text>
              <Text size="xs" c="dimmed">
                {meta.label} · {formatDate(expense.date)}
              </Text>
            </Stack>
          </Group>
          <Group gap="xs" wrap="nowrap">
            {allSettled && (
              <Badge size="xs" color="teal" variant="light">
                Saldato
              </Badge>
            )}
            {someSettled && (
              <Badge size="xs" color="yellow" variant="light">
                Parz. saldato
              </Badge>
            )}
            <Text size="sm" fw={700} ff="monospace">
              {formatCurrency(expense.amount, currency)}
            </Text>
          </Group>
        </Group>

        <Divider />

        {/* Splits */}
        <Stack gap={6}>
          {expense.splits.map((split) => {
            const isMe = split.userId === currentUserId;
            const isPayer = split.userId === expense.paidBy.id;
            return (
              <Group key={split.userId} justify="space-between">
                <Group gap="xs">
                  <Avatar
                    src={split.userImage}
                    size={22}
                    radius="xl"
                    name={split.userName}
                  />
                  <Text
                    size="xs"
                    fw={isMe ? 600 : 400}
                    td={split.settled ? "line-through" : undefined}
                    c={split.settled ? "dimmed" : undefined}
                  >
                    {isMe ? "Tu" : split.userName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {split.percentage.toFixed(0)}%
                  </Text>
                </Group>
                <Group gap="xs">
                  <Text
                    size="xs"
                    fw={500}
                    ff="monospace"
                    td={split.settled ? "line-through" : undefined}
                    c={split.settled ? "dimmed" : undefined}
                  >
                    {formatCurrency(split.amount, currency)}
                  </Text>
                  {/* Data saldo dello split, solo se non è il pagante */}
                  {!isPayer && split.settled && split.settledAt && (
                    <Text size="xs" c="teal">
                      {formatDate(split.settledAt)}
                    </Text>
                  )}
                </Group>
              </Group>
            );
          })}
        </Stack>

        {/* Footer: note + azioni */}
        <Group justify="space-between" align="center" mt={-4}>
          <Stack gap={2}>
            {expense.notes && (
              <Text size="xs" c="dimmed" fs="italic">
                {expense.notes}
              </Text>
            )}
            {allSettled && settledAt && (
              <Text size="xs" c="teal">
                Saldato completamente il {formatDate(settledAt)}
              </Text>
            )}
          </Stack>

          {iAmPayer && (
            <Tooltip label="Elimina spesa">
              <ActionIcon
                size="sm"
                variant="light"
                color="red"
                onClick={handleDelete}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Stack>
    </Card>
  );
}

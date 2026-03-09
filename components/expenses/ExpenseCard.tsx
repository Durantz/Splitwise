"use client";

import {
  Card, Group, Stack, Text, Avatar, Badge, ActionIcon,
  Tooltip, Divider, Progress,
} from "@mantine/core";
import { IconCheck, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import type { ExpenseDTO } from "@/types";
import { CATEGORY_META } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { markSplitSettled, deleteExpense } from "@/app/(app)/expenses/server";

interface Props {
  expense: ExpenseDTO;
  currentUserId: string;
  groupId: string;
  currency: string;
}

export default function ExpenseCard({ expense, currentUserId, groupId, currency }: Props) {
  const iAmPayer = expense.paidBy.id === currentUserId;
  const mySplit = expense.splits.find((s) => s.userId === currentUserId);
  const meta = CATEGORY_META[expense.category];

  // Quanto anticipo per gli altri (se ho pagato io)
  const myAdvanceForOthers = iAmPayer
    ? expense.splits
        .filter((s) => s.userId !== currentUserId && !s.settled)
        .reduce((sum, s) => sum + s.amount, 0)
    : 0;

  const myDebt = !iAmPayer && mySplit && !mySplit.settled ? mySplit.amount : 0;

  async function handleSettle() {
    await markSplitSettled(expense.id, currentUserId, groupId);
    notifications.show({ message: "Quota segnata come saldata", color: "teal" });
  }

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
            <Text size="xl" style={{ lineHeight: 1 }}>{meta.icon}</Text>
            <Stack gap={0}>
              <Text size="sm" fw={600} lineClamp={1}>{expense.description}</Text>
              <Text size="xs" c="dimmed">
                {meta.label} · {formatDate(expense.date)}
              </Text>
            </Stack>
          </Group>
          <Stack gap={0} align="flex-end">
            <Text size="sm" fw={700} ff="monospace">
              {formatCurrency(expense.amount, currency)}
            </Text>
            {iAmPayer && myAdvanceForOthers > 0 && (
              <Text size="xs" c="teal" fw={500}>
                +{formatCurrency(myAdvanceForOthers, currency)} da ricevere
              </Text>
            )}
            {!iAmPayer && myDebt > 0 && (
              <Text size="xs" c="red" fw={500}>
                -{formatCurrency(myDebt, currency)} da dare
              </Text>
            )}
          </Stack>
        </Group>

        <Divider />

        {/* Splits */}
        <Stack gap={6}>
          {expense.splits.map((split) => {
            const isMe = split.userId === currentUserId;
            return (
              <Group key={split.userId} justify="space-between">
                <Group gap="xs">
                  <Avatar src={split.userImage} size={22} radius="xl" name={split.userName} />
                  <Text size="xs" fw={isMe ? 600 : 400}>
                    {isMe ? "Tu" : split.userName}
                  </Text>
                  <Text size="xs" c="dimmed">{split.percentage.toFixed(0)}%</Text>
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
                  <Badge
                    size="xs"
                    color={split.settled ? "teal" : "orange"}
                    variant="light"
                  >
                    {split.settled ? "Saldato" : "Aperto"}
                  </Badge>
                </Group>
              </Group>
            );
          })}
        </Stack>

        {/* Actions */}
        <Group justify="flex-end" gap="xs">
          {/* Segna la MIA quota come saldata */}
          {!iAmPayer && mySplit && !mySplit.settled && (
            <Tooltip label="Segna come saldato">
              <ActionIcon
                size="sm"
                variant="light"
                color="teal"
                onClick={handleSettle}
              >
                <IconCheck size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {/* Elimina — solo chi ha pagato */}
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

        {expense.notes && (
          <Text size="xs" c="dimmed" fs="italic" mt={-4}>
            {expense.notes}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

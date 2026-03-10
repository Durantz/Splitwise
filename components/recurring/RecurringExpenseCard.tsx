"use client";

import {
  Card,
  Group,
  Stack,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  Menu,
  Loader,
} from "@mantine/core";
import {
  IconRepeat,
  IconDots,
  IconTrash,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  toggleRecurringExpense,
  deleteRecurringExpense,
} from "@/app/(app)/recurring/server";
import { CATEGORY_META } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import type { RecurringExpenseDTO } from "@/app/(app)/recurring/server";

const FREQUENCY_LABEL: Record<string, string> = {
  daily: "Ogni giorno",
  weekly: "Ogni settimana",
  monthly: "Ogni mese",
  yearly: "Ogni anno",
};

interface Props {
  recurring: RecurringExpenseDTO;
  groupId: string;
  currency: string;
  currentUserId: string;
}

export default function RecurringExpenseCard({
  recurring,
  groupId,
  currency,
  currentUserId,
}: Props) {
  const meta = CATEGORY_META[recurring.category];
  const isOwner = recurring.paidBy.id === currentUserId;
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    try {
      await toggleRecurringExpense(recurring.id, groupId);
      notifications.show({
        message: recurring.active
          ? "Spesa ricorrente sospesa"
          : "Spesa ricorrente riattivata",
        color: recurring.active ? "orange" : "teal",
      });
    } catch {
      notifications.show({ message: "Errore", color: "red" });
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteRecurringExpense(recurring.id, groupId);
      notifications.show({
        message: "Spesa ricorrente eliminata",
        color: "gray",
      });
    } catch {
      notifications.show({ message: "Errore", color: "red" });
      setDeleting(false);
    }
  }

  return (
    <Card p="md" radius="md" withBorder opacity={recurring.active ? 1 : 0.55}>
      <Group justify="space-between" wrap="nowrap">
        {/* Left: icona + info */}
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Text size="xl" style={{ lineHeight: 1 }}>
            {meta.icon}
          </Text>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Group gap="xs" wrap="nowrap">
              <Text size="sm" fw={600} lineClamp={1}>
                {recurring.description}
              </Text>
              {!recurring.active && (
                <Badge size="xs" color="gray" variant="light">
                  Sospesa
                </Badge>
              )}
            </Group>
            <Group gap="xs">
              <Badge
                size="xs"
                color="violet"
                variant="light"
                leftSection={<IconRepeat size={10} />}
              >
                {FREQUENCY_LABEL[recurring.frequency]}
              </Badge>
              <Text size="xs" c="dimmed">
                dal {formatDate(recurring.startDate)}
                {recurring.endDate
                  ? ` · fino al ${formatDate(recurring.endDate)}`
                  : ""}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Pagato da{" "}
              <Text span fw={500} c="dark">
                {recurring.paidBy.id === currentUserId
                  ? "te"
                  : recurring.paidBy.name}
              </Text>
            </Text>
          </Stack>
        </Group>

        {/* Right: importo + azioni */}
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" fw={700} ff="monospace">
            {formatCurrency(recurring.amount, currency)}
          </Text>

          {isOwner && (
            <Menu shadow="md" width={180} position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  loading={deleting || toggling}
                >
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={
                    toggling ? (
                      <Loader size={14} />
                    ) : recurring.active ? (
                      <IconPlayerPause size={14} />
                    ) : (
                      <IconPlayerPlay size={14} />
                    )
                  }
                  disabled={toggling || deleting}
                  onClick={handleToggle}
                >
                  {toggling
                    ? "..."
                    : recurring.active
                    ? "Sospendi"
                    : "Riattiva"}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={
                    deleting ? (
                      <Loader size={14} color="red" />
                    ) : (
                      <IconTrash size={14} />
                    )
                  }
                  disabled={deleting || toggling}
                  onClick={handleDelete}
                >
                  {deleting ? "Eliminazione..." : "Elimina"}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>
    </Card>
  );
}

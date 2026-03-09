"use client";

import { useState } from "react";
import {
  Card,
  Group,
  Avatar,
  Text,
  Stack,
  Badge,
  Button,
  Collapse,
  ActionIcon,
  Divider,
} from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { CATEGORY_META, type PairBalance } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import SettleModal from "@/components/settlements/SettleModal";

interface Props {
  pair: PairBalance;
  currentUserId: string;
  groupId: string;
  currency: string;
}

export default function PairBalanceCard({
  pair,
  currentUserId,
  groupId,
  currency,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);

  const iOwe = pair.netAmount < 0; // io devo a pair.user
  const amount = Math.abs(pair.netAmount);

  if (pair.unsettledExpenses.length === 0 && Math.abs(pair.netAmount) < 0.01)
    return null;

  return (
    <>
      <Card p="md" radius="md" withBorder>
        <Stack gap="sm">
          {/* Header */}
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Avatar
                src={pair.user.image}
                size={40}
                radius="xl"
                name={pair.user.name}
              />
              <Stack gap={2}>
                <Text size="sm" fw={600}>
                  {pair.user.name}
                </Text>
                <Text size="xs" c={iOwe ? "red" : "teal"} fw={500}>
                  {iOwe
                    ? `Devi ${formatCurrency(amount, currency)}`
                    : `Ti deve ${formatCurrency(amount, currency)}`}
                </Text>
              </Stack>
            </Group>

            <Group gap="xs">
              {iOwe && (
                <Button
                  size="xs"
                  color="teal"
                  variant="light"
                  onClick={() => setSettleOpen(true)}
                >
                  Salda
                </Button>
              )}
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setExpanded((v) => !v)}
                aria-label="Dettaglio spese"
              >
                {expanded ? (
                  <IconChevronUp size={16} />
                ) : (
                  <IconChevronDown size={16} />
                )}
              </ActionIcon>
            </Group>
          </Group>

          {/* Dettaglio spese */}
          <Collapse in={expanded}>
            <Divider mb="sm" />
            <Stack gap={6}>
              {pair.unsettledExpenses.map((row) => {
                const meta =
                  CATEGORY_META[row.category as keyof typeof CATEGORY_META];
                return (
                  <Group
                    key={row.expenseId}
                    justify="space-between"
                    wrap="nowrap"
                  >
                    <Group
                      gap="xs"
                      wrap="nowrap"
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <Text size="sm" style={{ lineHeight: 1 }}>
                        {meta?.icon ?? "📦"}
                      </Text>
                      <Stack gap={0} style={{ minWidth: 0 }}>
                        <Text size="xs" fw={500} truncate>
                          {row.description}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDate(row.date)}
                        </Text>
                      </Stack>
                    </Group>
                    <Stack gap={0} align="flex-end">
                      <Text
                        size="xs"
                        fw={600}
                        ff="monospace"
                        c={row.paidByMe ? "teal" : "red"}
                      >
                        {row.paidByMe ? "+" : "-"}
                        {formatCurrency(row.myShare, currency)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        su {formatCurrency(row.totalAmount, currency)}
                      </Text>
                    </Stack>
                  </Group>
                );
              })}
            </Stack>
          </Collapse>

          {/* Contatore spese aperte */}
          {!expanded && pair.unsettledExpenses.length > 0 && (
            <Text size="xs" c="dimmed">
              {pair.unsettledExpenses.length}{" "}
              {pair.unsettledExpenses.length === 1
                ? "spesa aperta"
                : "spese aperte"}
              {" · "}
              <Text
                component="span"
                size="xs"
                c="blue"
                style={{ cursor: "pointer" }}
                onClick={() => setExpanded(true)}
              >
                Mostra dettaglio
              </Text>
            </Text>
          )}
        </Stack>
      </Card>

      <SettleModal
        groupId={groupId}
        currency={currency}
        pair={pair}
        opened={settleOpen}
        onClose={() => setSettleOpen(false)}
      />
    </>
  );
}

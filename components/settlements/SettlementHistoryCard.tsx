"use client";

import {
  Card,
  Group,
  Stack,
  Text,
  Avatar,
  Badge,
  Collapse,
  ActionIcon,
  Divider,
  ThemeIcon,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconReceipt,
  IconDownload,
} from "@tabler/icons-react";
import { useState } from "react";
import { CATEGORY_META, PAYMENT_METHOD_META } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import type { SettlementHistoryEntry } from "@/app/(app)/settlements/server";
import { generateSettlementPdf } from "@/lib/generateSettlementPdf";

interface Props {
  entry: SettlementHistoryEntry;
  currentUserId: string;
  currency: string;
}

export default function SettlementHistoryCard({
  entry,
  currentUserId,
  currency,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const iAmFrom = entry.from.id === currentUserId;
  const paymentMeta = PAYMENT_METHOD_META[entry.paymentMethod];

  // ID da mostrare: paymentId inserito dall'utente oppure le ultime 6 cifre dell'_id
  const displayId = entry.paymentId ?? `#${entry.id.slice(-6).toUpperCase()}`;

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      await generateSettlementPdf(entry, currency);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Card p="md" radius="md" withBorder>
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <Avatar
              src={entry.from.image}
              size={36}
              radius="xl"
              name={entry.from.name}
            />
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Group gap="xs" wrap="nowrap">
                <Text size="sm" fw={600}>
                  {iAmFrom ? "Tu" : entry.from.name}
                </Text>
                <Text size="xs" c="dimmed">
                  →
                </Text>
                <Text size="sm" fw={600}>
                  {entry.to.id === currentUserId ? "Tu" : entry.to.name}
                </Text>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="dimmed">
                  {formatDate(entry.paidAt)}
                </Text>
                <Text size="xs" c="dimmed">
                  ·
                </Text>
                <Text size="xs" c="dimmed">
                  {paymentMeta.icon} {paymentMeta.label}
                </Text>
                <Text size="xs" c="blue" ff="monospace">
                  {displayId}
                </Text>
              </Group>
            </Stack>
          </Group>

          <Group gap="xs" wrap="nowrap">
            <Text size="sm" fw={700} ff="monospace" c="teal">
              {formatCurrency(entry.amount, currency)}
            </Text>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              loading={pdfLoading}
              onClick={handleDownloadPdf}
              title="Scarica ricevuta PDF"
            >
              <IconDownload size={14} />
            </ActionIcon>
            {entry.settledExpenses.length > 0 && (
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? (
                  <IconChevronUp size={14} />
                ) : (
                  <IconChevronDown size={14} />
                )}
              </ActionIcon>
            )}
          </Group>
        </Group>

        {/* Note */}
        {entry.note && (
          <Text size="xs" c="dimmed" fs="italic">
            {entry.note}
          </Text>
        )}

        {/* Spese saldato - collassabile */}
        {entry.settledExpenses.length > 0 && (
          <Collapse in={expanded}>
            <Divider mb="sm" />
            <Stack gap={6}>
              <Text
                size="xs"
                fw={600}
                tt="uppercase"
                c="dimmed"
                style={{ letterSpacing: "0.06em" }}
              >
                Spese saldato ({entry.settledExpenses.length})
              </Text>
              {entry.settledExpenses.map((exp) => {
                const meta =
                  CATEGORY_META[exp.category as keyof typeof CATEGORY_META];
                return (
                  <Group
                    key={exp.expenseId}
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
                          {exp.description}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDate(exp.date)}
                        </Text>
                      </Stack>
                    </Group>
                    <Stack gap={0} align="flex-end">
                      <Text size="xs" fw={600} ff="monospace">
                        {formatCurrency(exp.share, currency)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        su {formatCurrency(exp.totalAmount, currency)}
                      </Text>
                    </Stack>
                  </Group>
                );
              })}
            </Stack>
          </Collapse>
        )}

        {/* Footer: contatore spese se collassato */}
        {!expanded && entry.settledExpenses.length > 0 && (
          <Text
            size="xs"
            c="blue"
            style={{ cursor: "pointer" }}
            onClick={() => setExpanded(true)}
          >
            {entry.settledExpenses.length}{" "}
            {entry.settledExpenses.length === 1
              ? "spesa saldata"
              : "spese saldato"}{" "}
            · Mostra dettaglio
          </Text>
        )}
      </Stack>
    </Card>
  );
}

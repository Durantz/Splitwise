import { Stack, Text, Center } from "@mantine/core";
import { IconReceipt } from "@tabler/icons-react";
import SettlementHistoryCard from "./SettlementHistoryCard";
import type { SettlementHistoryEntry } from "@/app/(app)/settlements/server";

interface Props {
  entries: SettlementHistoryEntry[];
  currentUserId: string;
  currency: string;
}

export default function SettlementHistoryView({
  entries,
  currentUserId,
  currency,
}: Props) {
  if (entries.length === 0) {
    return (
      <Center py={60}>
        <Stack align="center" gap="xs">
          <IconReceipt size={32} color="var(--mantine-color-dimmed)" />
          <Text c="dimmed" size="sm">
            Nessun pagamento registrato.
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="sm">
      {entries.map((entry) => (
        <SettlementHistoryCard
          key={entry.id}
          entry={entry}
          currentUserId={currentUserId}
          currency={currency}
        />
      ))}
    </Stack>
  );
}

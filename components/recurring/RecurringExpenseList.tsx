import { Stack, Text, Center, Group } from "@mantine/core";
import { IconRepeat } from "@tabler/icons-react";
import RecurringExpenseCard from "./RecurringExpenseCard";
import type { RecurringExpenseDTO } from "@/app/(app)/recurring/server";

interface Props {
  recurring: RecurringExpenseDTO[];
  groupId: string;
  currency: string;
  currentUserId: string;
}

export default function RecurringExpenseList({
  recurring,
  groupId,
  currency,
  currentUserId,
}: Props) {
  if (recurring.length === 0) {
    return (
      <Center py={60}>
        <Stack align="center" gap="xs">
          <IconRepeat size={32} color="var(--mantine-color-dimmed)" />
          <Text c="dimmed" size="sm">
            Nessuna spesa ricorrente. Aggiungine una!
          </Text>
        </Stack>
      </Center>
    );
  }

  const active = recurring.filter((r) => r.active);
  const suspended = recurring.filter((r) => !r.active);

  return (
    <Stack gap="sm">
      {active.map((r) => (
        <RecurringExpenseCard
          key={r.id}
          recurring={r}
          groupId={groupId}
          currency={currency}
          currentUserId={currentUserId}
        />
      ))}

      {suspended.length > 0 && (
        <>
          <Text size="xs" c="dimmed" fw={500} mt="xs">
            SOSPESE
          </Text>
          {suspended.map((r) => (
            <RecurringExpenseCard
              key={r.id}
              recurring={r}
              groupId={groupId}
              currency={currency}
              currentUserId={currentUserId}
            />
          ))}
        </>
      )}
    </Stack>
  );
}

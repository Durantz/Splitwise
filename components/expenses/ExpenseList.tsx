import { Stack, Text, Center } from "@mantine/core";
import type { ExpenseDTO } from "@/types";
import ExpenseCard from "./ExpenseCard";

interface Props {
  expenses: ExpenseDTO[];
  currentUserId: string;
  groupId: string;
  currency: string;
}

export default function ExpenseList({ expenses, currentUserId, groupId, currency }: Props) {
  if (expenses.length === 0) {
    return (
      <Center py={80}>
        <Text c="dimmed" size="sm">Nessuna spesa. Aggiungine una!</Text>
      </Center>
    );
  }

  return (
    <Stack gap="sm">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          currentUserId={currentUserId}
          groupId={groupId}
          currency={currency}
        />
      ))}
    </Stack>
  );
}

import { Stack, Group, Avatar, Text } from "@mantine/core";
import type { BalanceEntry } from "@/types";
import { formatCurrency } from "@/lib/format";

interface Props {
  balances: BalanceEntry[];
  currency: string;
}

export default function BalanceList({ balances, currency }: Props) {
  return (
    <Stack gap={0}>
      {balances.map(({ user, amount }) => {
        const owesMe = amount > 0;
        return (
          <Group
            key={user.id}
            justify="space-between"
            py="xs"
            style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}
          >
            <Group gap="sm">
              <Avatar src={user.image} size={32} radius="xl" name={user.name} />
              <Stack gap={0}>
                <Text size="sm" fw={500}>{user.name}</Text>
                <Text size="xs" c="dimmed">{owesMe ? "ti deve" : "gli devi"}</Text>
              </Stack>
            </Group>
            <Text size="sm" fw={600} c={owesMe ? "teal" : "red"} ff="monospace">
              {owesMe ? "+" : "-"}{formatCurrency(Math.abs(amount), currency)}
            </Text>
          </Group>
        );
      })}
    </Stack>
  );
}

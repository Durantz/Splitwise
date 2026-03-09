import { Stack, Text, Center } from "@mantine/core";
import type { PairBalance, GroupDTO } from "@/types";
import PairBalanceCard from "@/components/settlements/PairBalanceCard";

interface Props {
  pairs: PairBalance[];
  currentUserId: string;
  group: GroupDTO;
}

export default function SettlementsView({
  pairs,
  currentUserId,
  group,
}: Props) {
  const activePairs = pairs.filter(
    (p) => Math.abs(p.netAmount) >= 0.01 || p.unsettledExpenses.length > 0
  );

  if (activePairs.length === 0) {
    return (
      <Center py={60}>
        <Text c="dimmed" size="sm">
          Tutto in pari! 🎉
        </Text>
      </Center>
    );
  }

  // Separa: prima i debiti (iOwe), poi i crediti
  const debts = activePairs.filter((p) => p.netAmount < 0);
  const credits = activePairs.filter((p) => p.netAmount >= 0);

  return (
    <Stack gap="md">
      {debts.length > 0 && (
        <Stack gap="xs">
          <Text
            size="xs"
            fw={600}
            tt="uppercase"
            c="dimmed"
            style={{ letterSpacing: "0.06em" }}
          >
            Devi pagare
          </Text>
          {debts.map((pair) => (
            <PairBalanceCard
              key={pair.user.id}
              pair={pair}
              currentUserId={currentUserId}
              groupId={group.id}
              currency={group.currency}
            />
          ))}
        </Stack>
      )}

      {credits.length > 0 && (
        <Stack gap="xs">
          <Text
            size="xs"
            fw={600}
            tt="uppercase"
            c="dimmed"
            style={{ letterSpacing: "0.06em" }}
          >
            Devi ricevere
          </Text>
          {credits.map((pair) => (
            <PairBalanceCard
              key={pair.user.id}
              pair={pair}
              currentUserId={currentUserId}
              groupId={group.id}
              currency={group.currency}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

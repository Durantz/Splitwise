"use client";

import {
  Stack, Title, Text, SimpleGrid, Card, Group, ThemeIcon, Anchor, Alert,
} from "@mantine/core";
import {
  IconReceipt, IconTrendingUp, IconTrendingDown, IconScale,
  IconArrowRight, IconAlertCircle,
} from "@tabler/icons-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import BalanceList from "@/components/dashboard/BalanceList";
import GroupSelector from "@/components/dashboard/GroupSelector";
import type { GroupDTO, DashboardData } from "@/types";

interface Props {
  session: { user: { name?: string | null } };
  groups: GroupDTO[];
  activeGroup: GroupDTO;
  data: DashboardData;
}

export default function DashboardView({ session, groups, activeGroup, data }: Props) {
  const kpis = [
    {
      label: "Spese questo mese",
      value: String(data.monthlyCount),
      icon: IconReceipt,
      color: "gray",
    },
    {
      label: "Totale speso",
      value: formatCurrency(data.monthlyTotal, activeGroup.currency),
      icon: IconReceipt,
      color: "gray",
    },
    {
      label: "Ti devono",
      value: formatCurrency(data.totalOwedToMe, activeGroup.currency),
      icon: IconTrendingUp,
      color: "teal",
    },
    {
      label: "Devi dare",
      value: formatCurrency(data.totalIOwe, activeGroup.currency),
      icon: IconTrendingDown,
      color: "red",
    },
  ];

  const netPositive = data.netBalance >= 0;

  return (
    <Stack maw={720} mx="auto" p="md" gap="lg">
      <Group justify="space-between" align="flex-end">
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.06em" }}>
            {data.monthLabel}
          </Text>
          <Title order={2} fw={600}>
            Ciao, {session.user.name?.split(" ")[0]} 👋
          </Title>
        </Stack>
        <GroupSelector groups={groups} activeGroupId={activeGroup.id} />
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        {kpis.map((kpi) => (
          <Card key={kpi.label} p="md">
            <ThemeIcon variant="light" color={kpi.color} size="sm" mb="xs">
              <kpi.icon size={14} />
            </ThemeIcon>
            <Text size="xl" fw={700} lh={1}>{kpi.value}</Text>
            <Text size="xs" c="dimmed" mt={4}>{kpi.label}</Text>
          </Card>
        ))}
      </SimpleGrid>

      <Card p="lg" bg={netPositive ? "dark.8" : "white"} style={{ border: netPositive ? "none" : undefined }}>
        <Group align="flex-start" justify="space-between">
          <Stack gap={4}>
            <Text size="xs" fw={600} tt="uppercase" style={{ letterSpacing: "0.06em" }} c="dimmed">
              Bilancio netto
            </Text>
            <Text size="2rem" fw={700} lh={1} c={netPositive ? "white" : data.netBalance < 0 ? "red" : "dark"}>
              {data.netBalance >= 0 ? "+" : ""}{formatCurrency(data.netBalance, activeGroup.currency)}
            </Text>
            <Text size="xs" c={netPositive ? "dark.4" : "dimmed"}>
              {data.netBalance > 0 ? "Sei in credito" : data.netBalance < 0 ? "Sei in debito" : "Tutto in pari 🎉"}
            </Text>
          </Stack>
          <ThemeIcon variant="light" color={netPositive ? "teal" : "red"} size="xl" radius="xl">
            <IconScale size={20} />
          </ThemeIcon>
        </Group>
      </Card>

      {data.balances.length > 0 && (
        <Card p="md">
          <Group justify="space-between" mb="sm">
            <Text fw={600} size="sm">Dettaglio per persona</Text>
            <Anchor component={Link} href={`/expenses?groupId=${activeGroup.id}`} size="xs" c="dimmed">
              Tutte le spese <IconArrowRight size={12} style={{ verticalAlign: "middle" }} />
            </Anchor>
          </Group>
          <BalanceList balances={data.balances} currency={activeGroup.currency} />
        </Card>
      )}
    </Stack>
  );
}

export function DashboardEmpty() {
  return (
    <Stack maw={720} mx="auto" p="md" gap="lg">
      <Title order={2} fw={600}>Dashboard</Title>
      <Alert icon={<IconAlertCircle />} color="gray" title="Nessun gruppo">
        Crea il tuo primo gruppo per iniziare a tracciare le spese.{" "}
        <Anchor component={Link} href="/groups/new" fw={600}>
          Crea gruppo →
        </Anchor>
      </Alert>
    </Stack>
  );
}

"use client";

import {
  Stack,
  Title,
  Text,
  SimpleGrid,
  Card,
  Group,
  ThemeIcon,
  Anchor,
  Alert,
} from "@mantine/core";
import {
  IconReceipt,
  IconTrendingUp,
  IconTrendingDown,
  IconScale,
  IconArrowRight,
  IconAlertCircle,
  IconCalendar,
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

export default function DashboardView({
  session,
  groups,
  activeGroup,
  data,
}: Props) {
  const netPositive = data.netBalance >= 0;
  const c = activeGroup.currency;

  return (
    <Stack maw={720} mx="auto" p="md" gap="lg">
      <Group justify="space-between" align="flex-end">
        <Title order={2} fw={600}>
          Ciao, {session.user.name?.split(" ")[0]} 👋
        </Title>
        <GroupSelector groups={groups} activeGroupId={activeGroup.id} />
      </Group>

      {/* ── Riga 1: situazione totale aperta ── */}
      <Stack gap="xs">
        <Text
          size="xs"
          fw={600}
          tt="uppercase"
          c="dimmed"
          style={{ letterSpacing: "0.06em" }}
        >
          Totale aperto
        </Text>
        <SimpleGrid id="dashboard-totale" cols={3} spacing="sm">
          <Card p="md">
            <ThemeIcon variant="light" color="teal" size="sm" mb="xs">
              <IconTrendingUp size={14} />
            </ThemeIcon>
            <Text size="xl" fw={700} lh={1} c="teal">
              {formatCurrency(data.totalOwedToMe, c)}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Ti devono
            </Text>
          </Card>

          <Card p="md">
            <ThemeIcon variant="light" color="red" size="sm" mb="xs">
              <IconTrendingDown size={14} />
            </ThemeIcon>
            <Text size="xl" fw={700} lh={1} c="red">
              {formatCurrency(data.totalIOwe, c)}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Devi dare
            </Text>
          </Card>

          <Card p="lg" bg={netPositive ? "dark.8" : "white"}>
            <ThemeIcon
              variant="light"
              color={netPositive ? "teal" : "red"}
              size="sm"
              mb="xs"
            >
              <IconScale size={14} />
            </ThemeIcon>
            <Text size="xl" fw={700} lh={1} c={netPositive ? "white" : "red"}>
              {data.netBalance >= 0 ? "+" : ""}
              {formatCurrency(data.netBalance, c)}
            </Text>
            <Text size="xs" c={netPositive ? "dark.4" : "dimmed"} mt={4}>
              {data.netBalance > 0
                ? "Sei in credito"
                : data.netBalance < 0
                ? "Sei in debito"
                : "Tutto in pari 🎉"}
            </Text>
          </Card>
        </SimpleGrid>
      </Stack>

      {/* ── Riga 2: mese corrente ── */}
      <Stack gap="xs">
        <Text
          size="xs"
          fw={600}
          tt="uppercase"
          c="dimmed"
          style={{ letterSpacing: "0.06em" }}
        >
          {data.monthLabel}
        </Text>
        <SimpleGrid id="dashboard-mese" cols={{ base: 2, sm: 4 }} spacing="sm">
          <Card p="md">
            <ThemeIcon variant="light" color="gray" size="sm" mb="xs">
              <IconReceipt size={14} />
            </ThemeIcon>
            <Text size="xl" fw={700} lh={1}>
              {data.monthlyCount}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Spese
            </Text>
          </Card>

          <Card p="md">
            <ThemeIcon variant="light" color="gray" size="sm" mb="xs">
              <IconCalendar size={14} />
            </ThemeIcon>
            <Text size="xl" fw={700} lh={1}>
              {formatCurrency(data.monthlyTotal, c)}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Speso
            </Text>
          </Card>

          <Card p="md">
            <ThemeIcon variant="light" color="teal" size="sm" mb="xs">
              <IconTrendingUp size={14} />
            </ThemeIcon>
            <Text size="xl" fw={700} lh={1} c="teal">
              {formatCurrency(data.monthlyOwedToMe, c)}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Ti devono
            </Text>
          </Card>

          <Card p="md">
            <ThemeIcon variant="light" color="red" size="sm" mb="xs">
              <IconTrendingDown size={14} />
            </ThemeIcon>
            <Text size="xl" fw={700} lh={1} c="red">
              {formatCurrency(data.monthlyIOwe, c)}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Devi dare
            </Text>
          </Card>
        </SimpleGrid>
      </Stack>

      {/* ── Dettaglio per persona ── */}
      {data.balances.length > 0 && (
        <Card p="md">
          <Group justify="space-between" mb="sm">
            <Text fw={600} size="sm">
              Dettaglio per persona
            </Text>
            <Anchor
              component={Link}
              href={`/expenses?groupId=${activeGroup.id}`}
              size="xs"
              c="dimmed"
            >
              Tutte le spese{" "}
              <IconArrowRight size={12} style={{ verticalAlign: "middle" }} />
            </Anchor>
          </Group>
          <BalanceList balances={data.balances} currency={c} />
        </Card>
      )}
    </Stack>
  );
}

export function DashboardEmpty() {
  return (
    <Stack maw={720} mx="auto" p="md" gap="lg">
      <Title order={2} fw={600}>
        Dashboard
      </Title>
      <Alert icon={<IconAlertCircle />} color="gray" title="Nessun gruppo">
        Crea il tuo primo gruppo per iniziare a tracciare le spese.{" "}
        <Anchor component={Link} href="/groups/new" fw={600}>
          Crea gruppo →
        </Anchor>
      </Alert>
    </Stack>
  );
}

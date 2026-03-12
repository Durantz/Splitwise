"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Container,
  Title,
  Select,
  Group,
  Stack,
  Paper,
  Text,
  Badge,
  Divider,
  Loader,
  Center,
  Button,
  ActionIcon,
  Modal,
  SegmentedControl,
  Accordion,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { notifications } from "@mantine/notifications";
import {
  PeriodOption,
  PeriodStats,
  comparePeriods,
  deletePeriod,
} from "./server";
import {
  CATEGORIES,
  getCategoryColor,
  getCategoryLabel,
} from "@/lib/categories";

function formatEur(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    signDisplay: "exceptZero",
  }).format(value);
}

function DeltaBadge({ a, b }: { a: number; b: number }) {
  if (b === 0)
    return (
      <Badge color="gray" variant="light">
        —
      </Badge>
    );

  // Delta = variazione di A rispetto a B (il periodo di riferimento)
  // positivo = A è più alto di B, negativo = A è più basso di B
  const delta = ((a - b) / Math.abs(b)) * 100;

  if (Math.abs(delta) < 0.5)
    return (
      <Badge color="gray" variant="light" leftSection={<IconMinus size={11} />}>
        —
      </Badge>
    );

  // "peggio" = hai meno soldi:
  // - uscite (b < 0): a più negativo = peggio → delta < 0
  // - entrate (b > 0): a più basso = peggio → delta < 0
  // In entrambi i casi: delta < 0 → peggio → rosso
  const isWorse = delta < 0;
  const icon =
    delta > 0 ? <IconArrowUp size={11} /> : <IconArrowDown size={11} />;

  return (
    <Badge color={isWorse ? "red" : "green"} leftSection={icon} variant="light">
      {Math.abs(delta).toFixed(1)}%
    </Badge>
  );
}

function CategoryCompareTable({
  statsA,
  statsB,
  labelA,
  labelB,
}: {
  statsA: PeriodStats;
  statsB: PeriodStats;
  labelA: string;
  labelB: string;
}) {
  const rows = useMemo(() => {
    const allCats = new Set([
      ...statsA.categories.map((c) => c.category),
      ...statsB.categories.map((c) => c.category),
    ]);
    return Array.from(allCats)
      .map((cat) => ({
        category: cat,
        totalA: statsA.categories.find((c) => c.category === cat)?.total ?? 0,
        totalB: statsB.categories.find((c) => c.category === cat)?.total ?? 0,
      }))
      .sort((x, y) => x.totalA - y.totalA);
  }, [statsA, statsB]);

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "4px 8px",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Categoria
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "4px 8px",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {labelA}
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "4px 8px",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {labelB}
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "4px 8px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Δ
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ category, totalA, totalB }) => (
            <tr key={category}>
              <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    backgroundColor: `var(--mantine-color-${getCategoryColor(
                      category
                    )}-light)`,
                    color: `var(--mantine-color-${getCategoryColor(
                      category
                    )}-light-color)`,
                  }}
                >
                  {getCategoryLabel(category)}
                </span>
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "6px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                <Text size="sm" c={totalA >= 0 ? "green" : "red"} fw={500}>
                  {formatEur(totalA)}
                </Text>
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "6px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                <Text size="sm" c={totalB >= 0 ? "green" : "red"} fw={500}>
                  {formatEur(totalB)}
                </Text>
              </td>
              <td style={{ textAlign: "right", padding: "6px 8px" }}>
                <DeltaBadge a={totalB} b={totalA} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompareBarChart({
  statsA,
  statsB,
  labelA,
  labelB,
}: {
  statsA: PeriodStats;
  statsB: PeriodStats;
  labelA: string;
  labelB: string;
}) {
  const data = useMemo(() => {
    const allCats = new Set([
      ...statsA.categories.map((c) => c.category),
      ...statsB.categories.map((c) => c.category),
    ]);
    return Array.from(allCats).map((cat) => ({
      name: getCategoryLabel(cat),
      [labelA]: Math.abs(
        statsA.categories.find((c) => c.category === cat)?.total ?? 0
      ),
      [labelB]: Math.abs(
        statsB.categories.find((c) => c.category === cat)?.total ?? 0
      ),
    }));
  }, [statsA, statsB, labelA, labelB]);

  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 10, left: 10, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-35}
          textAnchor="end"
          tick={{ fontSize: 11 }}
          interval={0}
        />
        <YAxis tickFormatter={(v) => `${v}€`} tick={{ fontSize: 11 }} />
        <RechartsTooltip
          formatter={(v) => (typeof v === "number" ? formatEur(v) : v)}
          contentStyle={{
            backgroundColor: "var(--mantine-color-dark-7)",
            border: "1px solid var(--mantine-color-dark-4)",
            borderRadius: "var(--mantine-radius-sm)",
            color: "var(--mantine-color-white)",
          }}
          labelStyle={{ color: "var(--mantine-color-dimmed)" }}
        />
        <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 16 }} />
        <Bar dataKey={labelA} fill="#339af0" radius={[4, 4, 0, 0]} />
        <Bar dataKey={labelB} fill="#94d82d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DailyLineChart({
  statsA,
  statsB,
  labelA,
  labelB,
}: {
  statsA: PeriodStats;
  statsB: PeriodStats;
  labelA: string;
  labelB: string;
}) {
  const data = useMemo(() => {
    const MS_DAY = 86400000;

    const toRelativeMap = (daily: { date: string; total: number }[]) => {
      const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
      if (sorted.length === 0) return new Map<number, number>();
      const startMs = new Date(sorted[0].date).getTime();
      const byDay = new Map<number, number>();
      for (const d of sorted) {
        const rel =
          Math.round((new Date(d.date).getTime() - startMs) / MS_DAY) + 1;
        byDay.set(rel, (byDay.get(rel) ?? 0) + d.total);
      }
      return byDay;
    };

    const mapA = toRelativeMap(statsA.dailyTotals);
    const mapB = toRelativeMap(statsB.dailyTotals);

    const maxDay = Math.max(
      mapA.size > 0 ? Math.max(...mapA.keys()) : 0,
      mapB.size > 0 ? Math.max(...mapB.keys()) : 0
    );

    const result: Array<Record<string, number>> = [];
    let cumA = 0;
    let cumB = 0;
    for (let day = 1; day <= maxDay; day++) {
      cumA += mapA.get(day) ?? 0;
      cumB += mapB.get(day) ?? 0;
      result.push({
        day,
        [labelA]: cumA,
        ...(labelB ? { [labelB]: cumB } : {}),
      });
    }
    return result;
  }, [statsA, statsB, labelA, labelB]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11 }}
          label={{ value: "Giorno", position: "insideBottomRight", offset: -5 }}
        />
        <YAxis tickFormatter={(v) => `${v}€`} tick={{ fontSize: 11 }} />
        <RechartsTooltip
          formatter={(v) => (typeof v === "number" ? formatEur(v) : v)}
          contentStyle={{
            backgroundColor: "var(--mantine-color-dark-7)",
            border: "1px solid var(--mantine-color-dark-4)",
            borderRadius: "var(--mantine-radius-sm)",
            color: "var(--mantine-color-white)",
          }}
          labelStyle={{ color: "var(--mantine-color-dimmed)" }}
          labelFormatter={(v) => `Giorno ${v}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey={labelA}
          stroke="#339af0"
          dot={false}
          strokeWidth={2}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey={labelB}
          stroke="#94d82d"
          dot={false}
          strokeWidth={2}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------------
// Componente principale
// ------------------------------------------------------------------
export function Spesometro({
  periods: initialPeriods,
}: {
  periods: PeriodOption[];
}) {
  // Il server restituisce dal più recente al più vecchio — invertiamo per A=vecchio, B=recente
  const [periods, setPeriods] = useState(() => [...initialPeriods].reverse());
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [periodAId, setPeriodAId] = useState<string | null>(null);
  const [periodBId, setPeriodBId] = useState<string | null>(null);
  const [stats, setStats] = useState<{ a: PeriodStats; b: PeriodStats } | null>(
    null
  );
  const [singleStats, setSingleStats] = useState<PeriodStats | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<PeriodOption | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [isDeleting, startDeleting] = useTransition();

  const labelA = periods.find((p) => p.id === periodAId)?.label ?? "Periodo A";
  const labelB = periods.find((p) => p.id === periodBId)?.label ?? "Periodo B";
  const singleLabel =
    periods.find((p) => p.id === periodAId)?.label ?? "Periodo";

  const runCompare = (aId: string, bId: string) => {
    startTransition(async () => {
      const result = await comparePeriods(aId, bId);
      setStats(result);
      setSingleStats(null);
    });
  };

  const runSingle = (id: string) => {
    startTransition(async () => {
      const result = await comparePeriods(id, id);
      setSingleStats(result.a);
      setStats(null);
    });
  };

  const handleModeChange = (val: string) => {
    const m = val as "single" | "compare";
    setMode(m);
    setStats(null);
    setSingleStats(null);
    if (m === "single" && periodAId) runSingle(periodAId);
    if (m === "compare" && periodAId && periodBId)
      runCompare(periodAId, periodBId);
  };

  const handleSelectA = (val: string | null) => {
    setPeriodAId(val);
    if (mode === "compare" && val && periodBId) runCompare(val, periodBId);
    if (mode === "single" && val) runSingle(val);
  };

  const handleSelectB = (val: string | null) => {
    setPeriodBId(val);
    if (mode === "compare" && periodAId && val) runCompare(periodAId, val);
  };

  const handleDeleteClick = (period: PeriodOption) => {
    setDeleteTarget(period);
    openDelete();
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    startDeleting(async () => {
      await deletePeriod(deleteTarget.id);
      const updated = periods.filter((p) => p.id !== deleteTarget.id);
      setPeriods(updated);
      if (periodAId === deleteTarget.id) setPeriodAId(updated[0]?.id ?? null);
      if (periodBId === deleteTarget.id)
        setPeriodBId(updated[1]?.id ?? updated[0]?.id ?? null);
      setStats(null);
      setSingleStats(null);
      closeDelete();
      setDeleteTarget(null);
      notifications.show({
        color: "green",
        message: `"${deleteTarget.label}" eliminato.`,
      });
    });
  };

  if (periods.length === 0) {
    return (
      <Container size="md" py="xl">
        <Title order={2} mb="md">
          Budget
        </Title>
        <Text c="dimmed" mb="md">
          Nessun periodo importato ancora.
        </Text>
        <Button
          component={Link}
          href="/budget/import"
          variant="light"
          leftSection={<IconPlus size={16} />}
          size="sm"
        >
          Importa
        </Button>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      {/* Modal conferma eliminazione */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Elimina periodo"
        size="sm"
        centered
      >
        <Text size="sm" mb="lg">
          Sei sicuro di voler eliminare <strong>{deleteTarget?.label}</strong>?
          Tutti i movimenti associati verranno cancellati.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete} disabled={isDeleting}>
            Annulla
          </Button>
          <Button
            color="red"
            onClick={handleDeleteConfirm}
            loading={isDeleting}
          >
            Elimina
          </Button>
        </Group>
      </Modal>

      <Group justify="space-between" mb="xl">
        <Title order={2}>Budget</Title>
        <Group gap="xs">
          <SegmentedControl
            value={mode}
            onChange={handleModeChange}
            data={[
              { label: "Singolo", value: "single" },
              { label: "Confronto", value: "compare" },
            ]}
            size="sm"
          />
          <Button
            component={Link}
            href="/budget/import"
            variant="light"
            leftSection={<IconPlus size={16} />}
            size="sm"
          >
            Importa
          </Button>
          <Button
            component={Link}
            href="/budget/edit-categories"
            variant="subtle"
            size="sm"
          >
            Categorie
          </Button>
        </Group>
      </Group>

      <Paper p="md" withBorder mb="xl">
        <Stack gap="md">
          {mode === "single" ? (
            <Select
              label="Periodo"
              data={periods.map((p) => ({
                value: p.id,
                label: `${p.label} (${new Date(p.from).toLocaleDateString(
                  "it-IT",
                  { day: "2-digit", month: "2-digit", year: "2-digit" }
                )} → ${new Date(p.to).toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })})`,
              }))}
              value={periodAId}
              onChange={handleSelectA}
            />
          ) : (
            <Group align="flex-end" wrap="wrap">
              <Select
                label="Periodo A"
                data={periods.map((p) => ({
                  value: p.id,
                  label: `${p.label} (${new Date(p.from).toLocaleDateString(
                    "it-IT",
                    { day: "2-digit", month: "2-digit", year: "2-digit" }
                  )} → ${new Date(p.to).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })})`,
                }))}
                value={periodAId}
                onChange={handleSelectA}
                style={{ flex: 1, minWidth: 240 }}
              />
              <Text c="dimmed" mb={6} fw={500}>
                vs
              </Text>
              <Select
                label="Periodo B"
                data={periods.map((p) => ({
                  value: p.id,
                  label: `${p.label} (${new Date(p.from).toLocaleDateString(
                    "it-IT",
                    { day: "2-digit", month: "2-digit", year: "2-digit" }
                  )} → ${new Date(p.to).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })})`,
                }))}
                value={periodBId}
                onChange={handleSelectB}
                style={{ flex: 1, minWidth: 240 }}
              />
            </Group>
          )}

          <Accordion variant="contained" radius="sm">
            <Accordion.Item value="periodi">
              <Accordion.Control>
                <Text size="sm" fw={500}>
                  Periodi importati ({periods.length})
                </Text>
              </Accordion.Control>
              <Accordion.Panel>
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  <Stack gap={4} p={4}>
                    {periods.map((p) => (
                      <Group key={p.id} justify="space-between" wrap="nowrap">
                        <Stack gap={0}>
                          <Text size="sm">{p.label}</Text>
                          <Text size="xs" c="dimmed">
                            {new Date(p.from).toLocaleDateString("it-IT")} →{" "}
                            {new Date(p.to).toLocaleDateString("it-IT")}
                          </Text>
                        </Stack>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => handleDeleteClick(p)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    ))}
                  </Stack>
                </div>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Stack>
      </Paper>

      {isPending && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {!isPending && mode === "single" && singleStats && (
        <Stack gap="xl">
          <Group grow align="stretch">
            <Paper p="md" withBorder>
              {(() => {
                const entrate = singleStats.categories
                  .filter((c) => c.total > 0)
                  .reduce((acc, c) => acc + c.total, 0);
                const uscite = singleStats.categories
                  .filter((c) => c.total < 0)
                  .reduce((acc, c) => acc + c.total, 0);
                return (
                  <>
                    <Text size="sm" c="dimmed" mb={4}>
                      {singleLabel}
                    </Text>
                    <Text
                      size="xl"
                      fw={700}
                      c={singleStats.grandTotal >= 0 ? "green" : "red"}
                      mb={8}
                    >
                      {formatEur(singleStats.grandTotal)}
                    </Text>
                    <Divider mb={8} />
                    <Group justify="space-between">
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">
                          Entrate
                        </Text>
                        <Text size="sm" fw={600} c="green">
                          {formatEur(entrate)}
                        </Text>
                      </Stack>
                      <Stack gap={2} align="flex-end">
                        <Text size="xs" c="dimmed">
                          Uscite
                        </Text>
                        <Text size="sm" fw={600} c="red">
                          {formatEur(uscite)}
                        </Text>
                      </Stack>
                    </Group>
                    <Text size="xs" c="dimmed" mt={6}>
                      {singleStats.categories.reduce(
                        (acc, c) => acc + c.count,
                        0
                      )}{" "}
                      movimenti
                    </Text>
                  </>
                );
              })()}
            </Paper>
          </Group>

          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Spese per categoria
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[...singleStats.categories]
                  .sort((a, b) => a.total - b.total)
                  .map((c) => ({
                    name: getCategoryLabel(c.category),
                    valore: Math.abs(c.total),
                    raw: c.total,
                  }))}
                margin={{ top: 5, right: 10, left: 10, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis tickFormatter={(v) => `${v}€`} tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  formatter={(_v, _name, props) => [
                    formatEur(props.payload.raw),
                    "Totale",
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--mantine-color-dark-7)",
                    border: "1px solid var(--mantine-color-dark-4)",
                    borderRadius: "var(--mantine-radius-sm)",
                    color: "var(--mantine-color-white)",
                  }}
                  labelStyle={{ color: "var(--mantine-color-dimmed)" }}
                />
                <Bar dataKey="valore" fill="#339af0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Distribuzione giornaliera
            </Text>
            <DailyLineChart
              statsA={singleStats}
              statsB={singleStats}
              labelA={singleLabel}
              labelB=""
            />
          </Paper>

          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Dettaglio per categoria
            </Text>
            <Stack gap="xs">
              <Group justify="space-between" px="xs">
                <Text size="sm" fw={600} style={{ flex: 1 }}>
                  Categoria
                </Text>
                <Text size="sm" fw={600} w={110} ta="right">
                  Totale
                </Text>
              </Group>
              <Divider />
              {[...singleStats.categories]
                .sort((a, b) => a.total - b.total)
                .map((cat) => (
                  <Group
                    key={cat.category}
                    justify="space-between"
                    px="xs"
                    py={4}
                  >
                    <Badge
                      color={getCategoryColor(cat.category)}
                      variant="light"
                      style={{ flex: 1 }}
                    >
                      {getCategoryLabel(cat.category)}
                    </Badge>
                    <Text
                      size="sm"
                      w={110}
                      ta="right"
                      c={cat.total >= 0 ? "green" : "red"}
                      fw={500}
                    >
                      {formatEur(cat.total)}
                    </Text>
                  </Group>
                ))}
            </Stack>
          </Paper>
        </Stack>
      )}

      {!isPending && mode === "compare" && stats && (
        <Stack gap="xl">
          <Group grow align="stretch">
            {[
              { label: labelA, s: stats.a },
              { label: labelB, s: stats.b },
            ].map(({ label, s }) => {
              const entrate = s.categories
                .filter((c) => c.total > 0)
                .reduce((acc, c) => acc + c.total, 0);
              const uscite = s.categories
                .filter((c) => c.total < 0)
                .reduce((acc, c) => acc + c.total, 0);
              return (
                <Paper key={label} p="md" withBorder>
                  <Text size="sm" c="dimmed" mb={4}>
                    {label}
                  </Text>
                  <Text
                    size="xl"
                    fw={700}
                    c={s.grandTotal >= 0 ? "green" : "red"}
                    mb={8}
                  >
                    {formatEur(s.grandTotal)}
                  </Text>
                  <Divider mb={8} />
                  <Group justify="space-between">
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed">
                        Entrate
                      </Text>
                      <Text size="sm" fw={600} c="green">
                        {formatEur(entrate)}
                      </Text>
                    </Stack>
                    <Stack gap={2} align="flex-end">
                      <Text size="xs" c="dimmed">
                        Uscite
                      </Text>
                      <Text size="sm" fw={600} c="red">
                        {formatEur(uscite)}
                      </Text>
                    </Stack>
                  </Group>
                  <Text size="xs" c="dimmed" mt={6}>
                    {s.categories.reduce((acc, c) => acc + c.count, 0)}{" "}
                    movimenti
                  </Text>
                </Paper>
              );
            })}
          </Group>

          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Confronto per categoria
            </Text>
            <CompareBarChart
              statsA={stats.a}
              statsB={stats.b}
              labelA={labelA}
              labelB={labelB}
            />
          </Paper>

          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Dettaglio per categoria
            </Text>
            <CategoryCompareTable
              statsA={stats.a}
              statsB={stats.b}
              labelA={labelA}
              labelB={labelB}
            />
          </Paper>

          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Distribuzione giornaliera
            </Text>
            <DailyLineChart
              statsA={stats.a}
              statsB={stats.b}
              labelA={labelA}
              labelB={labelB}
            />
          </Paper>
        </Stack>
      )}
    </Container>
  );
}

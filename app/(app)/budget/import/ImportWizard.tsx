"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Container,
  Title,
  Text,
  Checkbox,
  Button,
  Group,
  Stack,
  FileButton,
  Paper,
  Alert,
  Badge,
  Select,
  Table,
  NumberFormatter,
  TextInput,
  Divider,
  Loader,
  Center,
} from "@mantine/core";
import { DatePickerInput, DatesRangeValue } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconUpload } from "@tabler/icons-react";
import {
  useXlsxParser,
  ParsedRow,
  CategoryRuleClient,
} from "@/hooks/useXlsxParser";
import { CATEGORIES, getCategoryColor } from "@/lib/categories";
import { importTransactions, ImportPayload } from "./server";

// ------------------------------------------------------------------
// Step 0 – Upload file
// ------------------------------------------------------------------
function StepUpload({
  onParsed,
  existingMappings,
  rules,
}: {
  onParsed: (rows: ParsedRow[]) => void;
  existingMappings: Record<string, string>;
  rules: CategoryRuleClient[];
}) {
  const { status, rows, error, parseFile, reset } = useXlsxParser();

  if (status === "done") {
    const autoCount = rows.filter((r) => r.autoMatched).length;
    const ruleCount = rows.filter((r) => r.matchedByRule).length;
    const newCount = rows.filter(
      (r) => !r.autoMatched && !r.matchedByRule
    ).length;
    return (
      <Stack>
        <Alert
          color="green"
          icon={<IconCheck size={16} />}
          title="File caricato"
        >
          {rows.length} movimenti letti —{" "}
          <strong>{autoCount} già riconosciuti</strong>
          {ruleCount > 0 && (
            <>
              , <strong>{ruleCount} pre-categorizzati da regola</strong>
            </>
          )}
          , <strong>{newCount} da categorizzare</strong>
        </Alert>
        <Group>
          <Button onClick={() => onParsed(rows)}>Continua</Button>
          <Button variant="subtle" onClick={reset}>
            Ricarica file
          </Button>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack>
      <Text c="dimmed">
        Carica il tuo estratto conto in formato <strong>.csv</strong> (BNL) o{" "}
        <strong>.xlsx</strong> (Fineco). Il file viene letto direttamente nel
        browser — nessun dato sensibile viene inviato al server.
      </Text>
      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      )}
      <FileButton
        onChange={(file) => file && parseFile(file, existingMappings, rules)}
        accept=".csv,.xlsx"
      >
        {(props) => (
          <Button
            {...props}
            leftSection={
              status === "parsing" ? (
                <Loader size="xs" />
              ) : (
                <IconUpload size={16} />
              )
            }
            disabled={status === "parsing"}
            w="fit-content"
          >
            {status === "parsing" ? "Lettura in corso…" : "Seleziona file"}
          </Button>
        )}
      </FileButton>
    </Stack>
  );
}

const SKIP_VALUE = "__skip__";
// ------------------------------------------------------------------
// Step 1 – Categorizzazione
// ------------------------------------------------------------------
function StepCategorize({
  rows,
  onDone,
}: {
  rows: ParsedRow[];
  onDone: (categorized: ParsedRow[]) => void;
}) {
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const row of rows) {
      if (row.category) init[row.normalizedDescription] = row.category;
    }
    return init;
  });

  const unknownGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        description: string;
        count: number;
        total: number;
        matchedByRule: boolean;
      }
    >();
    for (const row of rows) {
      if (row.autoMatched) continue;
      const existing = map.get(row.normalizedDescription);
      if (existing) {
        existing.count++;
        existing.total += row.amount;
      } else {
        map.set(row.normalizedDescription, {
          description: row.cleanDescription,
          count: 1,
          total: row.amount,
          matchedByRule: row.matchedByRule,
        });
      }
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
  }, [rows]);

  const allHandled = unknownGroups.every((g) => assignments[g.key]);
  const pendingCount = unknownGroups.filter((g) => !assignments[g.key]).length;

  if (unknownGroups.length === 0) {
    return (
      <Stack>
        <Alert color="green" icon={<IconCheck size={16} />}>
          Tutte le voci sono già state riconosciute automaticamente.
        </Alert>
        <Button w="fit-content" onClick={() => onDone(rows)}>
          Continua
        </Button>
      </Stack>
    );
  }

  return (
    <Stack>
      <Text c="dimmed">
        Assegna una categoria a ciascuna voce nuova. Le descrizioni uguali sono
        raggruppate. Usa "Escludi" per ignorare una voce senza salvarla.
      </Text>
      <Stack gap="xs">
        {unknownGroups.map((g) => {
          const isSkipped = assignments[g.key] === SKIP_VALUE;
          return (
            <Paper key={g.key} p="sm" withBorder opacity={isSkipped ? 0.5 : 1}>
              <Stack gap={6}>
                <Group justify="space-between" wrap="nowrap">
                  <Group
                    gap="xs"
                    wrap="nowrap"
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <Text
                      size="sm"
                      fw={500}
                      style={{
                        minWidth: 0,
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {g.description}
                    </Text>
                    {g.matchedByRule && (
                      <Badge
                        size="xs"
                        color="blue"
                        variant="light"
                        style={{ flexShrink: 0 }}
                      >
                        Regola
                      </Badge>
                    )}
                  </Group>
                  <Group
                    gap="xs"
                    wrap="nowrap"
                    ml="xs"
                    style={{ flexShrink: 0 }}
                  >
                    <Badge variant="outline" color="gray" size="sm">
                      {g.count}×
                    </Badge>
                    <Text
                      size="sm"
                      fw={600}
                      c={g.total >= 0 ? "green" : "red"}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <NumberFormatter
                        value={g.total}
                        decimalScale={2}
                        prefix={g.total >= 0 ? "+" : ""}
                        suffix=" €"
                        thousandSeparator="."
                        decimalSeparator=","
                      />
                    </Text>
                  </Group>
                </Group>
                <Group gap="sm" wrap="nowrap">
                  <Select
                    placeholder="Seleziona categoria…"
                    data={CATEGORIES.map((c) => ({
                      value: c.value,
                      label: c.label,
                    }))}
                    value={isSkipped ? null : assignments[g.key] ?? null}
                    onChange={(val) =>
                      val &&
                      setAssignments((prev) => ({ ...prev, [g.key]: val }))
                    }
                    size="sm"
                    clearable={false}
                    disabled={isSkipped}
                    style={{ flex: 1 }}
                  />
                  <Checkbox
                    label="Escludi"
                    size="sm"
                    checked={isSkipped}
                    onChange={(e) =>
                      setAssignments((prev) => ({
                        ...prev,
                        [g.key]: e.target.checked ? SKIP_VALUE : "",
                      }))
                    }
                  />
                </Group>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
      <Group>
        <Button
          onClick={() =>
            onDone(
              rows.map((row) => ({
                ...row,
                category:
                  assignments[row.normalizedDescription] ?? row.category,
              }))
            )
          }
          disabled={!allHandled}
        >
          Conferma categorie
        </Button>
        {!allHandled && (
          <Text size="sm" c="dimmed">
            {pendingCount} {pendingCount === 1 ? "voce ancora" : "voci ancora"}{" "}
            senza categoria
          </Text>
        )}
      </Group>
    </Stack>
  );
}

// ------------------------------------------------------------------
// Step 2 – Riepilogo e salvataggio
// ------------------------------------------------------------------
function StepSummary({
  rows,
  onImport,
  loading,
}: {
  rows: ParsedRow[];
  onImport: (label: string, from: Date, to: Date) => void;
  loading: boolean;
}) {
  const [label, setLabel] = useState("");
  const [range, setRange] = useState<DatesRangeValue>([null, null]);
  const [from, to] = range;

  const handleRangeChange = (value: DatesRangeValue) => {
    setRange(value);
  };

  const summary = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of rows) {
      if (!row.category) continue;
      map[row.category] = (map[row.category] ?? 0) + row.amount;
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const total = summary.reduce((acc, [, v]) => acc + v, 0);

  const applyStipendioPreset = () => {
    const now = new Date();
    const toDate = new Date(now.getFullYear(), now.getMonth(), 27);
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 27);
    setRange([fromDate, toDate]);
    const fmt = new Intl.DateTimeFormat("it-IT", {
      month: "long",
      year: "numeric",
    });
    setLabel(`Stipendio ${fmt.format(toDate)}`);
  };

  return (
    <Stack>
      <Text c="dimmed">
        Dai un nome al periodo e definisci le date di riferimento.
      </Text>

      <Group align="flex-end" wrap="wrap">
        <TextInput
          label="Nome periodo"
          placeholder="es. Marzo 2025"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        <Button variant="light" onClick={applyStipendioPreset} mb={1}>
          📅 Preset stipendio 27→27
        </Button>
      </Group>

      <DatePickerInput
        type="range"
        label="Periodo"
        placeholder="Seleziona intervallo"
        value={range}
        onChange={handleRangeChange}
        valueFormat="DD/MM/YYYY"
      />

      <Divider my="xs" label="Riepilogo per categoria" labelPosition="left" />

      <Table withTableBorder>
        <Table.Tbody>
          {summary.map(([cat, amount]) => (
            <Table.Tr key={cat}>
              <Table.Td>
                <Badge color={getCategoryColor(cat)} variant="light">
                  {CATEGORIES.find((c) => c.value === cat)?.label ?? cat}
                </Badge>
              </Table.Td>
              <Table.Td ta="right">
                <Text fw={500} c={amount >= 0 ? "green" : "red"} size="sm">
                  <NumberFormatter
                    value={amount}
                    decimalScale={2}
                    prefix={amount >= 0 ? "+" : ""}
                    suffix=" €"
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
          <Table.Tr>
            <Table.Td fw={700}>Totale</Table.Td>
            <Table.Td ta="right">
              <Text fw={700} c={total >= 0 ? "green" : "red"} size="sm">
                <NumberFormatter
                  value={total}
                  decimalScale={2}
                  prefix={total >= 0 ? "+" : ""}
                  suffix=" €"
                  thousandSeparator="."
                  decimalSeparator=","
                />
              </Text>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>

      <Button
        onClick={() =>
          from && to && onImport(label.trim(), new Date(from), new Date(to))
        }
        disabled={!label.trim() || !from || !to || loading}
        loading={loading}
        w="fit-content"
      >
        Salva e importa
      </Button>
    </Stack>
  );
}

// ------------------------------------------------------------------
// Wizard principale
// ------------------------------------------------------------------
export function ImportWizard({
  existingMappings,
  rules,
}: {
  existingMappings: Record<string, string>;
  rules: CategoryRuleClient[];
}) {
  const [active, setActive] = useState(0);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [categorizedRows, setCategorizedRows] = useState<ParsedRow[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleImport = (label: string, from: Date, to: Date) => {
    const newMappingsMap = new Map<
      string,
      { description: string; normalizedDescription: string; category: string }
    >();
    for (const row of categorizedRows) {
      if (
        !row.autoMatched &&
        !row.matchedByRule &&
        row.category &&
        row.category !== SKIP_VALUE &&
        !newMappingsMap.has(row.normalizedDescription)
      ) {
        newMappingsMap.set(row.normalizedDescription, {
          description: row.cleanDescription,
          normalizedDescription: row.normalizedDescription,
          category: row.category,
        });
      }
    }

    const payload: ImportPayload = {
      periodLabel: label,
      periodFrom: from.toISOString(),
      periodTo: to.toISOString(),
      newMappings: Array.from(newMappingsMap.values()),
      transactions: categorizedRows
        .filter((r) => r.category && r.category !== SKIP_VALUE)
        .map((r) => ({
          date: r.date.toISOString(),
          amount: r.amount,
          category: r.category!,
        })),
    };

    startTransition(async () => {
      const result = await importTransactions(payload);
      if (result.success) {
        notifications.show({
          color: "green",
          title: "Importazione completata",
          message: `${result.savedTransactions} movimenti salvati, ${result.savedMappings} nuove categorie memorizzate.`,
        });
        setActive(3);
      } else {
        notifications.show({
          color: "red",
          title: "Errore",
          message: result.error ?? "Errore sconosciuto",
        });
      }
    });
  };

  return (
    <Container size="md" py="xl">
      <Title order={2} mb="xl">
        Importa estratto conto
      </Title>

      {active < 3 && (
        <Group justify="center" mb="xl" gap="xs">
          {["Carica file", "Categorie", "Riepilogo"].map((label, i) => (
            <Group key={i} gap={6} wrap="nowrap">
              <Text
                size="sm"
                fw={700}
                w={26}
                h={26}
                style={{
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    i < active
                      ? "var(--mantine-color-green-6)"
                      : i === active
                      ? "var(--mantine-color-blue-6)"
                      : "var(--mantine-color-dark-4)",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {i < active ? "✓" : i + 1}
              </Text>
              <Text
                size="sm"
                c={i === active ? "blue" : i < active ? "green" : "dimmed"}
                fw={i === active ? 600 : 400}
              >
                {label}
              </Text>
              {i < 2 && (
                <Text c="dimmed" size="sm">
                  ›
                </Text>
              )}
            </Group>
          ))}
        </Group>
      )}

      {active === 3 ? (
        <Center mt="xl">
          <Stack align="center">
            <IconCheck size={48} color="green" />
            <Title order={3}>Importazione completata!</Title>
            <Text c="dimmed">
              Vai al <a href="/budget">budget</a> per analizzare i dati.
            </Text>
          </Stack>
        </Center>
      ) : (
        <Paper p="lg" withBorder>
          {active === 0 && (
            <StepUpload
              onParsed={(rows) => {
                setParsedRows(rows);
                setActive(1);
              }}
              existingMappings={existingMappings}
              rules={rules}
            />
          )}
          {active === 1 && (
            <StepCategorize
              rows={parsedRows}
              onDone={(rows) => {
                setCategorizedRows(rows);
                setActive(2);
              }}
            />
          )}
          {active === 2 && (
            <StepSummary
              rows={categorizedRows}
              onImport={handleImport}
              loading={isPending}
            />
          )}
        </Paper>
      )}
    </Container>
  );
}

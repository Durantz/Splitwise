"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Group,
  Stack,
  Text,
  SimpleGrid,
  Avatar,
  Divider,
  SegmentedControl,
  Chip,
  Badge,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconRepeat, IconInfoCircle } from "@tabler/icons-react";
import { createRecurringExpense } from "@/app/(app)/recurring/server";
import { CATEGORY_META, type ExpenseCategory, type GroupDTO } from "@/types";
import { formatCurrency } from "@/lib/format";
import "dayjs/locale/it";

interface Props {
  group: GroupDTO;
  currentUserId: string;
}

const CATEGORIES = Object.entries(CATEGORY_META) as [
  ExpenseCategory,
  (typeof CATEGORY_META)[ExpenseCategory]
][];

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Giornaliera" },
  { value: "weekly", label: "Settimanale" },
  { value: "monthly", label: "Mensile" },
  { value: "yearly", label: "Annuale" },
];

type SplitMode = "equal" | "custom";

export default function AddRecurringExpenseButton({
  group,
  currentUserId,
}: Props) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<string[]>(
    group.members.map((m) => m.id)
  );
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [customPcts, setCustomPcts] = useState<Record<string, number>>(
    Object.fromEntries(group.members.map((m) => [m.id, 0]))
  );

  const form = useForm({
    initialValues: {
      description: "",
      amount: 0 as number,
      category: "other" as ExpenseCategory,
      frequency: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
      startDate: new Date(),
      endDate: null as Date | null,
      paidBy: currentUserId,
      notes: "",
    },
    validate: {
      description: (v: string) => (!v.trim() ? "Campo obbligatorio" : null),
      amount: (v: number) => (v <= 0 ? "Importo non valido" : null),
      startDate: (v: Date | null) => (!v ? "Data obbligatoria" : null),
      endDate: (v: Date | null, values: any) => {
        if (!v) return null;
        if (values.startDate && v <= values.startDate) {
          return "La data di fine deve essere successiva alla data di inizio";
        }
        return null;
      },
    },
  });

  function resetEqualSplit(ids: string[]) {
    const n = ids.length;
    if (n === 0) return;
    const eachPct = parseFloat((100 / n).toFixed(4));
    const updated: Record<string, number> = {};
    ids.forEach((id, i) => {
      updated[id] =
        i === n - 1
          ? parseFloat((100 - eachPct * (n - 1)).toFixed(2))
          : parseFloat(eachPct.toFixed(2));
    });
    setCustomPcts((prev) => ({ ...prev, ...updated }));
  }

  function toggleParticipant(id: string) {
    const next = participants.includes(id)
      ? participants.filter((p) => p !== id)
      : [...participants, id];
    if (next.length === 0) return;
    setParticipants(next);
    if (splitMode === "equal") resetEqualSplit(next);
    else {
      setCustomPcts((prev) => {
        const u = { ...prev };
        group.members.forEach((m) => {
          if (!next.includes(m.id)) u[m.id] = 0;
        });
        return u;
      });
    }
  }

  function handleSplitModeChange(mode: SplitMode) {
    setSplitMode(mode);
    if (mode === "equal") resetEqualSplit(participants);
  }

  const customTotal = useMemo(
    () => participants.reduce((sum, id) => sum + (customPcts[id] ?? 0), 0),
    [participants, customPcts]
  );
  const customTotalOk = Math.abs(customTotal - 100) < 0.01;

  function buildSplits(amount: number) {
    if (splitMode === "equal") {
      const n = participants.length;
      const eachAmt = parseFloat((amount / n).toFixed(2));
      const eachPct = parseFloat((100 / n).toFixed(4));
      return participants.map((userId, i) => ({
        userId,
        percentage:
          i === n - 1
            ? parseFloat((100 - eachPct * (n - 1)).toFixed(2))
            : parseFloat(eachPct.toFixed(2)),
        amount:
          i === n - 1
            ? parseFloat((amount - eachAmt * (n - 1)).toFixed(2))
            : eachAmt,
      }));
    }
    return participants.map((userId) => {
      const pct = customPcts[userId] ?? 0;
      return {
        userId,
        percentage: pct,
        amount: parseFloat(((amount * pct) / 100).toFixed(2)),
      };
    });
  }

  function handleClose() {
    form.reset();
    setParticipants(group.members.map((m) => m.id));
    setSplitMode("equal");
    setCustomPcts(Object.fromEntries(group.members.map((m) => [m.id, 0])));
    setOpened(false);
  }

  async function handleSubmit(values: typeof form.values) {
    if (participants.length === 0) {
      notifications.show({
        message: "Seleziona almeno un partecipante",
        color: "orange",
      });
      return;
    }
    if (splitMode === "custom" && !customTotalOk) {
      notifications.show({
        message: `La somma delle percentuali deve essere 100% (attuale: ${customTotal.toFixed(
          1
        )}%)`,
        color: "orange",
      });
      return;
    }

    setLoading(true);
    try {
      await createRecurringExpense({
        groupId: group.id,
        description: values.description,
        category: values.category,
        amount: values.amount,
        frequency: values.frequency,
        startDate: new Date(values.startDate).toISOString(),
        endDate: values.endDate
          ? new Date(values.endDate).toISOString()
          : undefined,
        paidBy: values.paidBy,
        splits: buildSplits(values.amount),
        notes: values.notes || undefined,
      });

      notifications.show({
        message: "Spesa ricorrente creata! 🔁",
        color: "teal",
      });
      handleClose();
    } catch (err) {
      notifications.show({
        message: "Errore durante il salvataggio",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }

  const amount = form.values.amount || 0;

  return (
    <>
      <Button
        size="sm"
        variant="light"
        leftSection={<IconRepeat size={16} />}
        onClick={() => setOpened(true)}
      >
        Ricorrente
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Group gap="xs">
            <IconRepeat size={18} />
            <Text fw={600}>Nuova spesa ricorrente</Text>
          </Group>
        }
        size="md"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Descrizione */}
            <TextInput
              label="Descrizione"
              placeholder="es. Abbonamento Netflix, Affitto, Palestra…"
              {...form.getInputProps("description")}
            />

            {/* Importo + Categoria */}
            <Group grow>
              <NumberInput
                label="Importo"
                placeholder="0,00"
                min={0}
                decimalScale={2}
                fixedDecimalScale
                prefix={group.currency === "EUR" ? "€ " : group.currency + " "}
                {...form.getInputProps("amount")}
              />
              <Select
                label="Categoria"
                data={CATEGORIES.map(([value, meta]) => ({
                  value,
                  label: `${meta.icon} ${meta.label}`,
                }))}
                {...form.getInputProps("category")}
              />
            </Group>

            {/* Frequenza */}
            <Stack gap={6}>
              <Text size="sm" fw={500}>
                Frequenza
              </Text>
              <SegmentedControl
                data={FREQUENCY_OPTIONS}
                {...form.getInputProps("frequency")}
              />
            </Stack>

            {/* Date */}
            <Group grow align="flex-start">
              <DatePickerInput
                label="Data inizio"
                locale="it"
                valueFormat="DD/MM/YYYY"
                clearable={false}
                {...form.getInputProps("startDate")}
              />
              <DatePickerInput
                label="Data fine"
                locale="it"
                valueFormat="DD/MM/YYYY"
                clearable
                placeholder="Nessuna scadenza"
                description="Facoltativa"
                minDate={form.values.startDate ?? undefined}
                {...form.getInputProps("endDate")}
              />
            </Group>

            {/* Chi paga */}
            <Select
              label="Pagato da"
              data={group.members.map((m) => ({
                value: m.id,
                label: m.id === currentUserId ? `Tu (${m.name})` : m.name,
              }))}
              {...form.getInputProps("paidBy")}
            />

            <Divider />

            {/* Partecipanti */}
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Partecipanti
              </Text>
              <Chip.Group
                multiple
                value={participants}
                onChange={setParticipants}
              >
                <SimpleGrid cols={2} spacing="xs">
                  {group.members.map((m) => (
                    <Chip
                      key={m.id}
                      value={m.id}
                      size="sm"
                      variant="light"
                      onClick={() => toggleParticipant(m.id)}
                    >
                      <Group gap={6} wrap="nowrap">
                        <Avatar
                          src={m.image}
                          size={18}
                          radius="xl"
                          name={m.name}
                        />
                        <Text size="xs" truncate>
                          {m.id === currentUserId ? "Tu" : m.name}
                        </Text>
                      </Group>
                    </Chip>
                  ))}
                </SimpleGrid>
              </Chip.Group>
            </Stack>

            {/* Split mode */}
            {participants.length > 1 && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Come dividerla?
                </Text>
                <SegmentedControl
                  size="xs"
                  value={splitMode}
                  onChange={(v) => handleSplitModeChange(v as SplitMode)}
                  data={[
                    { label: "Equa", value: "equal" },
                    { label: "Personalizzata", value: "custom" },
                  ]}
                />

                <Stack gap={6} mt={4}>
                  {participants.map((userId) => {
                    const member = group.members.find((m) => m.id === userId)!;
                    const pct =
                      splitMode === "equal"
                        ? parseFloat((100 / participants.length).toFixed(1))
                        : customPcts[userId] ?? 0;
                    const memberAmount =
                      amount > 0
                        ? parseFloat(((amount * pct) / 100).toFixed(2))
                        : null;

                    return (
                      <Group key={userId} justify="space-between" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
                          <Avatar
                            src={member.image}
                            size={22}
                            radius="xl"
                            name={member.name}
                          />
                          <Text size="xs" truncate style={{ minWidth: 60 }}>
                            {userId === currentUserId ? "Tu" : member.name}
                          </Text>
                        </Group>

                        {splitMode === "custom" ? (
                          <Group gap="xs" wrap="nowrap">
                            <NumberInput
                              size="xs"
                              min={0}
                              max={100}
                              decimalScale={1}
                              suffix="%"
                              value={customPcts[userId] ?? 0}
                              onChange={(v) =>
                                setCustomPcts((prev) => ({
                                  ...prev,
                                  [userId]: Number(v) || 0,
                                }))
                              }
                              w={90}
                              styles={{ input: { textAlign: "right" } }}
                            />
                            {memberAmount !== null && (
                              <Text
                                size="xs"
                                c="dimmed"
                                ff="monospace"
                                w={70}
                                ta="right"
                              >
                                {formatCurrency(memberAmount, group.currency)}
                              </Text>
                            )}
                          </Group>
                        ) : (
                          <Group gap="xs">
                            <Text size="xs" c="dimmed">
                              {(100 / participants.length).toFixed(1)}%
                            </Text>
                            {memberAmount !== null && (
                              <Text
                                size="xs"
                                fw={500}
                                ff="monospace"
                                w={70}
                                ta="right"
                              >
                                {formatCurrency(memberAmount, group.currency)}
                              </Text>
                            )}
                          </Group>
                        )}
                      </Group>
                    );
                  })}

                  {splitMode === "custom" && (
                    <Group justify="flex-end" gap="xs" mt={2}>
                      <Text
                        size="xs"
                        fw={600}
                        c={customTotalOk ? "teal" : "red"}
                      >
                        Totale: {customTotal.toFixed(1)}%{" "}
                        {customTotalOk
                          ? "✓"
                          : `(mancano ${(100 - customTotal).toFixed(1)}%)`}
                      </Text>
                    </Group>
                  )}
                </Stack>
              </Stack>
            )}

            {/* Note */}
            <Textarea
              label="Note"
              placeholder="Facoltativo"
              rows={2}
              {...form.getInputProps("notes")}
            />

            {/* Info box */}
            <Alert
              icon={<IconInfoCircle size={16} />}
              color="blue"
              variant="light"
              p="xs"
            >
              <Text size="xs">
                Le occorrenze vengono aggiunte automaticamente ogni volta che
                apri le spese del gruppo. Nessun cron job, tutto in tempo reale.
              </Text>
            </Alert>

            <Group justify="flex-end">
              <Button variant="subtle" onClick={handleClose}>
                Annulla
              </Button>
              <Button
                type="submit"
                loading={loading}
                leftSection={<IconRepeat size={14} />}
              >
                Crea ricorrente
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

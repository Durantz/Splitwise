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
  UnstyledButton,
  Box,
  Checkbox,
  SegmentedControl,
  Avatar,
  Divider,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconInfoCircle } from "@tabler/icons-react";
import { createExpense } from "@/app/(app)/expenses/server";
import { CATEGORY_META, type ExpenseCategory, type GroupDTO } from "@/types";
import { formatCurrency } from "@/lib/format";
import "dayjs/locale/it";
import { Chip } from "@mantine/core";

interface Props {
  group: GroupDTO;
  currentUserId: string;
}

const CATEGORIES = Object.entries(CATEGORY_META) as [
  ExpenseCategory,
  (typeof CATEGORY_META)[ExpenseCategory]
][];

type SplitMode = "equal" | "custom";

// Converte Date → "YYYY-MM-DD" richiesto da input[type=date]
function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AddExpenseButton({ group, currentUserId }: Props) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 600px)");

  // Chi partecipa alla spesa (default: tutti)
  const [participants, setParticipants] = useState<string[]>(
    group.members.map((m) => m.id)
  );

  // Modalità divisione
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");

  // Percentuali custom: userId -> percentuale
  const [customPcts, setCustomPcts] = useState<Record<string, number>>(() =>
    Object.fromEntries(group.members.map((m) => [m.id, 0]))
  );

  const form = useForm({
    initialValues: {
      description: "",
      amount: 0 as number,
      category: "other" as ExpenseCategory,
      date: new Date(),
      paidBy: currentUserId,
      notes: "",
    },
    validate: {
      description: (v: string) => (!v.trim() ? "Campo obbligatorio" : null),
      amount: (v: number) => (v <= 0 ? "Importo non valido" : null),
      date: (v: Date) => (!v ? "Data obbligatoria" : null),
    },
    transformValues: (values) => ({
      ...values,
      date: values.date instanceof Date ? values.date : new Date(values.date),
    }),
  });

  // Ricalcola percentuali equali quando cambiano i partecipanti
  function resetEqualSplit(newParticipants: string[]) {
    const n = newParticipants.length;
    if (n === 0) return;
    const eachPct = parseFloat((100 / n).toFixed(4));
    const updated: Record<string, number> = {};
    newParticipants.forEach((id, i) => {
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

    if (next.length === 0) return; // almeno uno
    setParticipants(next);

    // resetta a equale quando cambiano i partecipanti
    if (splitMode === "equal") {
      resetEqualSplit(next);
    } else {
      // in custom, azzera chi non partecipa
      setCustomPcts((prev) => {
        const updated = { ...prev };
        group.members.forEach((m) => {
          if (!next.includes(m.id)) updated[m.id] = 0;
        });
        return updated;
      });
    }
  }

  function handleSplitModeChange(mode: SplitMode) {
    setSplitMode(mode);
    if (mode === "equal") {
      resetEqualSplit(participants);
    }
  }

  function handleCustomPctChange(userId: string, value: number) {
    setCustomPcts((prev) => ({ ...prev, [userId]: value }));
  }

  // Somma delle percentuali custom dei partecipanti
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
    } else {
      return participants.map((userId) => {
        const pct = customPcts[userId] ?? 0;
        return {
          userId,
          percentage: pct,
          amount: parseFloat(((amount * pct) / 100).toFixed(2)),
        };
      });
    }
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
      const splits = buildSplits(values.amount);
      await createExpense({
        groupId: group.id,
        description: values.description,
        category: values.category,
        amount: values.amount,
        date: values.date.toISOString(),
        paidBy: values.paidBy,
        splits,
        notes: values.notes || undefined,
      });

      notifications.show({ message: "Spesa aggiunta!", color: "teal" });
      handleClose();
    } catch {
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
        leftSection={<IconPlus size={16} />}
        onClick={() => setOpened(true)}
      >
        Aggiungi
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="Nuova spesa"
        size="md"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Descrizione */}
            <TextInput
              label="Descrizione"
              placeholder="es. Cena al ristorante"
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
                prefix={group.currency === "EUR" ? "€" : group.currency + " "}
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

            {/* Data + Chi ha pagato — UNICA modifica rispetto all'originale:
                su mobile usa input[type=date] nativo per evitare il popover
                che esce dallo schermo e lo zoom automatico di Safari */}
            <Group grow align="flex-start">
              <DatePickerInput
                label="Data"
                locale="it"
                valueFormat="DD/MM/YYYY"
                dropdownType={isMobile ? "modal" : "popover"}
                {...form.getInputProps("date")}
              />
              <Select
                label="Pagato da"
                data={group.members.map((m) => ({
                  value: m.id,
                  label: m.id === currentUserId ? `Tu (${m.name})` : m.name,
                }))}
                {...form.getInputProps("paidBy")}
              />
            </Group>

            <Divider />

            {/* Partecipanti */}
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Chi partecipa?
              </Text>
              <Chip.Group
                multiple
                value={participants}
                onChange={setParticipants}
              >
                <SimpleGrid cols={2} spacing="xs">
                  {group.members.map((m) => (
                    <Chip key={m.id} value={m.id} w="100%">
                      <Group gap="xs">
                        <Avatar
                          src={m.image}
                          size={20}
                          radius="xl"
                          name={m.name}
                        />
                        <Text size="xs">
                          {m.id === currentUserId ? "Tu" : m.name}
                        </Text>
                      </Group>
                    </Chip>
                  ))}
                </SimpleGrid>
              </Chip.Group>
            </Stack>

            {/* Modalità di divisione */}
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

                {/* Anteprima divisione */}
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
                                handleCustomPctChange(userId, Number(v) || 0)
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

                  {/* Totale custom con feedback errore */}
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

            <Group justify="flex-end">
              <Button variant="subtle" onClick={handleClose}>
                Annulla
              </Button>
              <Button type="submit" loading={loading}>
                Salva
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

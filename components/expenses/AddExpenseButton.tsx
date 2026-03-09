"use client";

import { useState } from "react";
import { Button, Modal, TextInput, NumberInput, Select, Textarea, Group, Stack, SegmentedControl, Text, SimpleGrid, UnstyledButton, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { createExpense } from "@/app/(app)/expenses/server";
import { CATEGORY_META, type ExpenseCategory, type GroupDTO } from "@/types";
import { calcEqualSplits } from "@/lib/format";
import "dayjs/locale/it";

interface Props {
  group: GroupDTO;
  currentUserId: string;
}

const CATEGORIES = Object.entries(CATEGORY_META) as [ExpenseCategory, (typeof CATEGORY_META)[ExpenseCategory]][];

export default function AddExpenseButton({ group, currentUserId }: Props) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);

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
      description: (v) => (!v.trim() ? "Campo obbligatorio" : null),
      amount: (v) => (v <= 0 ? "Importo non valido" : null),
    },
  });

  async function handleSubmit(values: typeof form.values) {
    setLoading(true);
    try {
      const splits = calcEqualSplits(
        values.amount,
        group.members.map((m) => m.id)
      );

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
      form.reset();
      setOpened(false);
    } catch {
      notifications.show({ message: "Errore durante il salvataggio", color: "red" });
    } finally {
      setLoading(false);
    }
  }

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
        onClose={() => setOpened(false)}
        title="Nuova spesa"
        size="md"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Descrizione"
              placeholder="es. Cena al ristorante"
              {...form.getInputProps("description")}
            />

            <Group grow>
              <NumberInput
                label="Importo (€)"
                placeholder="0,00"
                min={0}
                decimalScale={2}
                {...form.getInputProps("amount")}
              />
              <DateInput
                label="Data"
                locale="it"
                valueFormat="DD/MM/YYYY"
                {...form.getInputProps("date")}
              />
            </Group>

            {/* Categoria */}
            <Stack gap={6}>
              <Text size="sm" fw={500}>Categoria</Text>
              <SimpleGrid cols={4} spacing="xs">
                {CATEGORIES.map(([key, meta]) => {
                  const active = form.values.category === key;
                  return (
                    <UnstyledButton
                      key={key}
                      onClick={() => form.setFieldValue("category", key)}
                      style={{
                        borderRadius: "var(--mantine-radius-md)",
                        border: `1px solid ${active ? "var(--mantine-color-dark-6)" : "var(--mantine-color-gray-3)"}`,
                        background: active ? "var(--mantine-color-dark-7)" : "transparent",
                        padding: "8px 4px",
                        textAlign: "center",
                        transition: "all 0.1s",
                      }}
                    >
                      <Text size="lg" lh={1}>{meta.icon}</Text>
                      <Text size="10px" mt={4} c={active ? "white" : "dimmed"} fw={500}>
                        {meta.label.split(" ")[0]}
                      </Text>
                    </UnstyledButton>
                  );
                })}
              </SimpleGrid>
            </Stack>

            {/* Chi ha pagato */}
            <Stack gap={6}>
              <Text size="sm" fw={500}>Chi ha pagato</Text>
              <SegmentedControl
                value={form.values.paidBy}
                onChange={(v) => form.setFieldValue("paidBy", v)}
                data={group.members.map((m) => ({
                  value: m.id,
                  label: m.id === currentUserId ? "Tu" : m.name.split(" ")[0],
                }))}
                fullWidth
              />
            </Stack>

            <Textarea
              label="Note (opzionale)"
              placeholder="Aggiungi una nota..."
              rows={2}
              {...form.getInputProps("notes")}
            />

            <Text size="xs" c="dimmed">
              La spesa verrà divisa equamente tra {group.members.length} persone.
            </Text>

            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={() => setOpened(false)}>
                Annulla
              </Button>
              <Button type="submit" loading={loading}>
                Aggiungi spesa
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

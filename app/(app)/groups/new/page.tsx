"use client";

import {
  Stack, Title, TextInput, Select, Button, Group, SimpleGrid,
  UnstyledButton, Text, Paper,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createGroup } from "@/app/(app)/groups/server";

const EMOJIS = ["💸", "🏠", "✈️", "🍕", "🎉", "🏋️", "🎮", "🌍", "🛒", "🎓", "🎸", "⚽"];
const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "JPY"];

export default function NewGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { name: "", emoji: "💸", currency: "EUR" },
    validate: { name: (v) => (!v.trim() ? "Il nome è obbligatorio" : null) },
  });

  async function handleSubmit(values: typeof form.values) {
    setLoading(true);
    try {
      await createGroup(values);
      notifications.show({ message: "Gruppo creato!", color: "teal" });
      router.push("/groups");
    } catch {
      notifications.show({ message: "Errore nella creazione", color: "red" });
      setLoading(false);
    }
  }

  return (
    <Stack maw={480} mx="auto" p="md" gap="lg">
      <Title order={2} fw={600}>Nuovo gruppo</Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Emoji picker */}
          <Stack gap={6}>
            <Text size="sm" fw={500}>Icona</Text>
            <SimpleGrid cols={6} spacing="xs">
              {EMOJIS.map((e) => (
                <UnstyledButton
                  key={e}
                  onClick={() => form.setFieldValue("emoji", e)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    borderRadius: "var(--mantine-radius-md)",
                    border: `1px solid ${
                      form.values.emoji === e
                        ? "var(--mantine-color-dark-6)"
                        : "var(--mantine-color-gray-3)"
                    }`,
                    background: form.values.emoji === e
                      ? "var(--mantine-color-dark-7)"
                      : "transparent",
                  }}
                >
                  {e}
                </UnstyledButton>
              ))}
            </SimpleGrid>
          </Stack>

          <TextInput
            label="Nome del gruppo"
            placeholder="es. Casa 2024, Vacanza estate..."
            {...form.getInputProps("name")}
          />

          <Select
            label="Valuta"
            data={CURRENCIES}
            {...form.getInputProps("currency")}
          />

          <Group justify="flex-end" gap="sm" mt="sm">
            <Button variant="default" onClick={() => router.back()}>
              Annulla
            </Button>
            <Button type="submit" loading={loading}>
              Crea gruppo
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}

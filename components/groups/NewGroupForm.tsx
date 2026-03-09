"use client";

import { useState } from "react";
import {
  Stack,
  TextInput,
  SegmentedControl,
  Text,
  Button,
  Group,
  SimpleGrid,
  Box,
  Loader,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createGroup } from "@/app/(app)/groups/server";

const EMOJIS = ["💸", "🏠", "✈️", "🍕", "🎉", "🏋️", "🎮", "🌍", "🛒", "🎓"];
const CURRENCIES = ["EUR", "USD", "GBP", "CHF"];

export default function NewGroupForm() {
  const [emoji, setEmoji] = useState("💸");
  const [currency, setCurrency] = useState("EUR");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createGroup({
        name: formData.get("name") as string,
        emoji,
        currency,
      });
      // createGroup fa redirect, qui non arriviamo in caso di successo
    } catch (err: any) {
      notifications.show({ message: err.message ?? "Errore", color: "red" });
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {/* Emoji picker */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Icona del gruppo
          </Text>
          <SimpleGrid cols={5} spacing="xs">
            {EMOJIS.map((e) => (
              <Box
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  height: 44,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  cursor: "pointer",
                  border: `2px solid ${
                    emoji === e
                      ? "var(--mantine-color-dark-8)"
                      : "var(--mantine-color-gray-3)"
                  }`,
                  background:
                    emoji === e ? "var(--mantine-color-dark-8)" : "transparent",
                  transition: "all 120ms",
                }}
              >
                {e}
              </Box>
            ))}
          </SimpleGrid>
        </Stack>

        <TextInput
          name="name"
          label="Nome del gruppo"
          placeholder="es. Casa 2024"
          required
        />

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Valuta
          </Text>
          <SegmentedControl
            size="xs"
            radius="md"
            color="dark"
            value={currency}
            onChange={setCurrency}
            data={CURRENCIES}
          />
        </Stack>

        <Button
          type="submit"
          color="dark"
          fullWidth
          mt="xs"
          disabled={loading}
          leftSection={loading ? <Loader size={14} color="white" /> : null}
        >
          {loading ? "Creazione..." : "Crea gruppo"}
        </Button>
      </Stack>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import {
  Stack,
  Title,
  Text,
  TextInput,
  Button,
  Table,
  Group,
  ActionIcon,
  Tooltip,
  Alert,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconShieldCheck,
} from "@tabler/icons-react";
import { addAllowedEmail, removeAllowedEmail } from "./server";
import type { AllowedEmailDTO } from "./server";

interface Props {
  emails: AllowedEmailDTO[];
}

export default function UsersAdminView({ emails: initial }: Props) {
  const [emails, setEmails] = useState(initial);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Inserisci un'email valida.");
      return;
    }
    if (emails.some((e) => e.email === trimmed)) {
      setError("Email già presente.");
      return;
    }
    setError("");
    const optimistic: AllowedEmailDTO = {
      id: crypto.randomUUID(),
      email: trimmed,
      createdAt: new Date().toISOString(),
    };
    setEmails((prev) => [optimistic, ...prev]);
    setInput("");
    startTransition(async () => {
      await addAllowedEmail(trimmed);
    });
  }

  function handleRemove(id: string) {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    startTransition(async () => {
      await removeAllowedEmail(id);
    });
  }

  return (
    <Stack maw={560} mx="auto" p="md" gap="xl">
      <Stack gap={2}>
        <Group gap="xs">
          <IconShieldCheck size={20} />
          <Title order={2} fw={600}>
            Utenti autorizzati
          </Title>
        </Group>
        <Text c="dimmed" size="sm">
          Solo le email in questa lista possono accedere all'app tramite Google.
        </Text>
      </Stack>

      <Group align="flex-start" gap="xs">
        <TextInput
          placeholder="nome@esempio.com"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          error={error}
          style={{ flex: 1 }}
          disabled={isPending}
        />
        <Button
          leftSection={<IconPlus size={15} />}
          onClick={handleAdd}
          loading={isPending}
        >
          Aggiungi
        </Button>
      </Group>

      {emails.length === 0 ? (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="gray"
          variant="light"
        >
          Nessuna email autorizzata. Aggiungine una qui sopra.
        </Alert>
      ) : (
        <Table verticalSpacing="sm">
          <Table.Tbody>
            {emails.map((e) => (
              <Table.Tr key={e.id}>
                <Table.Td>
                  <Text size="sm">{e.email}</Text>
                </Table.Td>
                <Table.Td>
                  <Group justify="flex-end">
                    <Tooltip label="Rimuovi" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => handleRemove(e.id)}
                        disabled={isPending}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}

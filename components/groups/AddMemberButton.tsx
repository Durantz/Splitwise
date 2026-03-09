"use client";

import { useState } from "react";
import { Button, Modal, TextInput, Stack, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconUserPlus } from "@tabler/icons-react";
import { addMemberByEmail } from "@/app/(app)/groups/server";

export default function AddMemberButton({ groupId }: { groupId: string }) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: "" },
    validate: { email: (v) => (!v.includes("@") ? "Email non valida" : null) },
  });

  async function handleSubmit(values: typeof form.values) {
    setLoading(true);
    try {
      await addMemberByEmail(groupId, values.email);
      notifications.show({ message: "Membro aggiunto!", color: "teal" });
      form.reset();
      setOpened(false);
    } catch (e: any) {
      notifications.show({ message: e.message ?? "Errore", color: "red" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        size="xs"
        variant="light"
        leftSection={<IconUserPlus size={14} />}
        onClick={() => setOpened(true)}
      >
        Aggiungi
      </Button>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Aggiungi membro" size="sm" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="nome@esempio.com"
              description="L'utente deve aver già fatto accesso all'app."
              {...form.getInputProps("email")}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setOpened(false)}>Annulla</Button>
              <Button type="submit" loading={loading}>Aggiungi</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

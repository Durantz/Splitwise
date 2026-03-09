"use client";

import { useState } from "react";
import { Group, TextInput, Button, Text, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconUserPlus } from "@tabler/icons-react";
import { inviteMember } from "@/app/(app)/groups/server";

export default function InviteMemberForm({ groupId }: { groupId: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await inviteMember(groupId, email.trim());
      notifications.show({ message: `${email} aggiunto al gruppo`, color: "green" });
      setEmail("");
    } catch (err: any) {
      notifications.show({ message: err.message, color: "red" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Text size="sm" fw={500} mb="xs">Aggiungi membro</Text>
      <Text size="xs" c="dimmed" mb="sm">
        L&apos;utente deve avere già effettuato l&apos;accesso all&apos;app almeno una volta.
      </Text>
      <Group gap="xs">
        <TextInput
          placeholder="email@esempio.it"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          flex={1}
          size="sm"
        />
        <Button
          size="sm"
          color="dark"
          onClick={handleInvite}
          disabled={loading || !email.trim()}
          leftSection={loading ? <Loader size={12} color="white" /> : <IconUserPlus size={14} />}
        >
          Invita
        </Button>
      </Group>
    </div>
  );
}

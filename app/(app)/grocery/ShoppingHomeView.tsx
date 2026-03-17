"use client";

import { useState, useTransition } from "react";
import {
  Stack,
  Group,
  Text,
  Button,
  Paper,
  Badge,
  TextInput,
  Modal,
  Avatar,
  AvatarGroup,
  Center,
  ActionIcon,
  Menu,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconShoppingCart,
  IconDots,
  IconUserPlus,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import type { ShoppingGroupDTO } from "./server";
import {
  createShoppingGroup,
  addShoppingGroupMember,
  deleteShoppingGroup,
} from "./server";

function GroupCard({
  group,
  onDelete,
}: {
  group: ShoppingGroupDTO;
  onDelete: (id: string) => void;
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOpened, { open: openInvite, close: closeInvite }] =
    useDisclosure(false);
  const [isPending, startTransition] = useTransition();

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    startTransition(async () => {
      const result = await addShoppingGroupMember(group.id, inviteEmail);
      if (result.success) {
        notifications.show({ color: "green", message: "Membro aggiunto" });
        closeInvite();
        setInviteEmail("");
      } else {
        notifications.show({ color: "red", message: result.error ?? "Errore" });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteShoppingGroup(group.id);
      onDelete(group.id);
    });
  };

  return (
    <>
      <Paper p="md" withBorder>
        <Group justify="space-between" wrap="nowrap">
          <Link
            href={`/grocery/${group.id}`}
            style={{
              flex: 1,
              minWidth: 0,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Stack gap={4}>
              <Group gap="sm">
                <IconShoppingCart size={16} />
                <Text fw={600} size="sm">
                  {group.name}
                </Text>
                {group.openLists > 0 && (
                  <Badge color="blue" variant="light" size="sm">
                    {group.openLists}{" "}
                    {group.openLists === 1 ? "lista" : "liste"}
                  </Badge>
                )}
              </Group>
              <Group gap="xs">
                <AvatarGroup>
                  {group.members.slice(0, 4).map((m) => (
                    <Avatar
                      key={m.id}
                      src={m.image}
                      size={20}
                      radius="xl"
                      name={m.name}
                    />
                  ))}
                </AvatarGroup>
                <Text size="xs" c="dimmed">
                  {group.members.map((m) => m.name).join(", ")}
                </Text>
              </Group>
            </Stack>
          </Link>

          <Menu withinPortal position="bottom-end" shadow="sm">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="sm">
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconUserPlus size={14} />}
                onClick={openInvite}
              >
                Invita membro
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={handleDelete}
              >
                Elimina gruppo
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Paper>

      <Modal
        opened={inviteOpened}
        onClose={closeInvite}
        title={`Invita in "${group.name}"`}
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="email@esempio.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeInvite}>
              Annulla
            </Button>
            <Button
              onClick={handleInvite}
              loading={isPending}
              disabled={!inviteEmail.trim()}
            >
              Invita
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

export function ShoppingHomeView({
  groups: initialGroups,
}: {
  groups: ShoppingGroupDTO[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [newGroupName, setNewGroupName] = useState("");
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    const name = newGroupName.trim();
    if (!name) return;

    startTransition(async () => {
      const groupId = await createShoppingGroup(name);
      closeModal();
      setNewGroupName("");
      router.push(`/grocery/${groupId}`);
    });
  };

  const handleDelete = (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <Stack maw={600} mx="auto" p="md" gap="lg">
      <Group justify="space-between" align="center">
        <Text fw={700} size="xl">
          Lista della spesa
        </Text>
        <Button
          size="sm"
          leftSection={<IconPlus size={14} />}
          onClick={openModal}
        >
          Nuovo gruppo
        </Button>
      </Group>

      {groups.length === 0 ? (
        <Center py={80}>
          <Stack align="center" gap="sm">
            <IconShoppingCart size={48} color="var(--mantine-color-dimmed)" />
            <Text c="dimmed" size="sm" ta="center">
              Nessun gruppo spesa ancora.
              <br />
              Creane uno e invita chi vuoi!
            </Text>
            <Button
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={openModal}
              mt="xs"
            >
              Crea il primo gruppo
            </Button>
          </Stack>
        </Center>
      ) : (
        <Stack gap="sm">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} onDelete={handleDelete} />
          ))}
        </Stack>
      )}

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title="Nuovo gruppo spesa"
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label="Nome gruppo"
            placeholder="es. Casa, Famiglia, Coinquilini…"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeModal}>
              Annulla
            </Button>
            <Button
              onClick={handleCreate}
              loading={isPending}
              disabled={!newGroupName.trim()}
            >
              Crea
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

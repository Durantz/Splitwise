"use client";

import { useState, useTransition } from "react";
import {
  Stack,
  Group,
  Text,
  Button,
  Paper,
  Badge,
  ActionIcon,
  TextInput,
  Modal,
  Progress,
  Anchor,
  Avatar,
  AvatarGroup,
  Center,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconTrash,
  IconShoppingCart,
  IconCheck,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import type { ShoppingGroupDetailDTO, ShoppingListDTO } from "./server";
import { createShoppingList, deleteShoppingList } from "./server";

function ListCard({
  list,
  groupId,
  onDelete,
}: {
  list: ShoppingListDTO;
  groupId: string;
  onDelete: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const progress =
    list.totalItems > 0
      ? Math.round((list.checkedItems / list.totalItems) * 100)
      : 0;
  const isCompleted = list.status === "completed";

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await deleteShoppingList(groupId, list.id);
      onDelete(list.id);
    });
  };

  return (
    <Paper
      component={Link}
      href={`/grocery/${groupId}/${list.id}`}
      p="md"
      withBorder
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        opacity: isCompleted ? 0.75 : 1,
        transition: "opacity 150ms",
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            {isCompleted ? (
              <IconCheck size={16} color="var(--mantine-color-green-6)" />
            ) : (
              <IconShoppingCart size={16} />
            )}
            <Text fw={600} size="sm">
              {list.name}
            </Text>
          </Group>
          <Group gap="xs" wrap="nowrap">
            {isCompleted ? (
              <Badge color="green" variant="light" size="sm">
                Completata
              </Badge>
            ) : (
              <Badge color="blue" variant="light" size="sm">
                {list.totalItems - list.checkedItems} rimasti
              </Badge>
            )}
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={handleDelete}
              loading={isPending}
            >
              <IconTrash size={13} />
            </ActionIcon>
          </Group>
        </Group>

        {list.totalItems > 0 && (
          <Progress
            value={progress}
            size="xs"
            color={isCompleted ? "green" : "blue"}
            radius="xl"
          />
        )}

        <Text size="xs" c="dimmed">
          {list.totalItems === 0
            ? "Lista vuota"
            : `${list.checkedItems} / ${list.totalItems} prodotti`}
          {list.completedAt &&
            ` · ${new Date(list.completedAt).toLocaleDateString("it-IT")}`}
        </Text>
      </Stack>
    </Paper>
  );
}

export function ShoppingGroupView({
  group: initialGroup,
}: {
  group: ShoppingGroupDetailDTO;
}) {
  const [lists, setLists] = useState(initialGroup.lists);
  const [newListName, setNewListName] = useState("");
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const openLists = lists.filter((l) => l.status === "open");
  const completedLists = lists.filter((l) => l.status === "completed");

  const handleCreate = () => {
    const name = newListName.trim();
    if (!name) return;

    startTransition(async () => {
      const listId = await createShoppingList(initialGroup.id, name);
      closeModal();
      setNewListName("");
      router.push(`/grocery/${initialGroup.id}/${listId}`);
    });
  };

  const handleDelete = (id: string) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <Stack maw={600} mx="auto" p="md" gap="lg">
      {/* Header */}
      <Stack gap={4}>
        <Anchor component={Link} href="/grocery" size="xs" c="dimmed">
          ← Gruppi spesa
        </Anchor>
        <Group justify="space-between" align="center">
          <Text fw={700} size="xl">
            {initialGroup.name}
          </Text>
          <Button
            size="sm"
            leftSection={<IconPlus size={14} />}
            onClick={openModal}
          >
            Nuova lista
          </Button>
        </Group>

        {/* Membri */}
        <Group gap="xs">
          <AvatarGroup>
            {initialGroup.members.slice(0, 5).map((m) => (
              <Avatar
                key={m.id}
                src={m.image}
                size={24}
                radius="xl"
                name={m.name}
              />
            ))}
          </AvatarGroup>
          <Text size="xs" c="dimmed">
            {initialGroup.members.map((m) => m.name).join(", ")}
          </Text>
        </Group>
      </Stack>

      {/* Liste aperte */}
      {openLists.length > 0 && (
        <Stack gap="xs">
          <Text
            size="xs"
            fw={600}
            tt="uppercase"
            c="dimmed"
            style={{ letterSpacing: "0.06em" }}
          >
            In corso
          </Text>
          {openLists.map((l) => (
            <ListCard
              key={l.id}
              list={l}
              groupId={initialGroup.id}
              onDelete={handleDelete}
            />
          ))}
        </Stack>
      )}

      {/* Liste completate */}
      {completedLists.length > 0 && (
        <Stack gap="xs">
          <Divider
            label={
              <Text size="xs" c="dimmed">
                Storico
              </Text>
            }
            labelPosition="left"
          />
          {completedLists.map((l) => (
            <ListCard
              key={l.id}
              list={l}
              groupId={initialGroup.id}
              onDelete={handleDelete}
            />
          ))}
        </Stack>
      )}

      {/* Empty state */}
      {lists.length === 0 && (
        <Center py={60}>
          <Stack align="center" gap="xs">
            <IconShoppingCart size={36} color="var(--mantine-color-dimmed)" />
            <Text c="dimmed" size="sm">
              Nessuna lista ancora. Creane una!
            </Text>
          </Stack>
        </Center>
      )}

      {/* Modal nuova lista */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title="Nuova lista della spesa"
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label="Nome lista"
            placeholder="es. Spesa di martedì, Cena del weekend…"
            value={newListName}
            onChange={(e) => setNewListName(e.currentTarget.value)}
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
              disabled={!newListName.trim()}
            >
              Crea
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

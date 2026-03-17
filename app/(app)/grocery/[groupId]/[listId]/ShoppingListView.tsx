"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  Stack,
  Group,
  Text,
  Checkbox,
  ActionIcon,
  TextInput,
  NumberInput,
  Badge,
  Paper,
  Button,
  Anchor,
  Textarea,
  Collapse,
  Divider,
  Center,
  Loader,
  Autocomplete,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconTrash,
  IconPencil,
  IconCheck,
  IconX,
  IconPlus,
  IconShoppingCart,
} from "@tabler/icons-react";
import Link from "next/link";
import { notifications } from "@mantine/notifications";
import type { ShoppingListDetailDTO, ShoppingItemDTO } from "./server";
import {
  addShoppingItem,
  toggleShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  getProductSuggestions,
} from "./server";

// ------------------------------------------------------------------
// Item singolo
// ------------------------------------------------------------------
function ShoppingItemRow({
  item,
  groupId,
  listId,
  isCompleted,
  members,
}: {
  item: ShoppingItemDTO;
  groupId: string;
  listId: string;
  isCompleted: boolean;
  members: { id: string; name: string; image?: string }[];
}) {
  const [editing, { open: startEdit, close: stopEdit }] = useDisclosure(false);
  const [checked, setChecked] = useState(item.checked);
  const [isPending, startTransition] = useTransition();

  const [editName, setEditName] = useState(item.name);
  const [editQty, setEditQty] = useState<number | string>(item.quantity);
  const [editUnit, setEditUnit] = useState(item.unit);
  const [editNote, setEditNote] = useState(item.note);

  const checkedByName = item.checkedBy
    ? members.find((m) => m.id === item.checkedBy)?.name ?? "Qualcuno"
    : null;

  const handleToggle = () => {
    if (isCompleted) return;
    const next = !checked;
    setChecked(next); // ottimistico
    startTransition(async () => {
      await toggleShoppingItem(groupId, listId, item.id);
    });
  };

  const handleSaveEdit = () => {
    startTransition(async () => {
      await updateShoppingItem(groupId, listId, item.id, {
        name: editName,
        quantity: Number(editQty) || 1,
        unit: editUnit,
        note: editNote,
      });
      stopEdit();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteShoppingItem(groupId, listId, item.id);
    });
  };

  return (
    <Paper
      px="sm"
      py="xs"
      withBorder
      style={{
        opacity: checked ? 0.6 : 1,
        transition: "opacity 150ms ease",
      }}
    >
      <Stack gap={4}>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <Checkbox
              checked={checked}
              onChange={handleToggle}
              disabled={isCompleted || isPending}
              radius="xl"
            />
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text
                size="sm"
                fw={500}
                td={checked ? "line-through" : undefined}
                truncate
              >
                {item.name}
              </Text>
              <Group gap={4}>
                {(item.quantity !== 1 || item.unit) && (
                  <Text size="xs" c="dimmed">
                    {item.quantity}
                    {item.unit ? ` ${item.unit}` : ""}
                  </Text>
                )}
                {item.note && (
                  <Text size="xs" c="dimmed" fs="italic" truncate>
                    · {item.note}
                  </Text>
                )}
              </Group>
            </Stack>
          </Group>

          {!isCompleted && (
            <Group gap={4} wrap="nowrap">
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={startEdit}
                disabled={isPending}
              >
                <IconPencil size={13} />
              </ActionIcon>
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
          )}
        </Group>

        {checked && checkedByName && (
          <Text size="xs" c="dimmed" pl={34}>
            Preso da {checkedByName}
          </Text>
        )}

        {/* Form modifica inline */}
        <Collapse in={editing}>
          <Stack gap="xs" pt="xs" pl={34}>
            <Group grow gap="xs">
              <TextInput
                size="xs"
                placeholder="Nome"
                value={editName}
                onChange={(e) => setEditName(e.currentTarget.value)}
              />
              <NumberInput
                size="xs"
                placeholder="Qtà"
                value={editQty}
                onChange={setEditQty}
                min={0}
                w={70}
              />
              <TextInput
                size="xs"
                placeholder="Unità"
                value={editUnit}
                onChange={(e) => setEditUnit(e.currentTarget.value)}
                w={70}
              />
            </Group>
            <TextInput
              size="xs"
              placeholder="Note (es. marca)"
              value={editNote}
              onChange={(e) => setEditNote(e.currentTarget.value)}
            />
            <Group gap="xs">
              <Button
                size="xs"
                leftSection={<IconCheck size={12} />}
                onClick={handleSaveEdit}
                loading={isPending}
              >
                Salva
              </Button>
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                leftSection={<IconX size={12} />}
                onClick={stopEdit}
              >
                Annulla
              </Button>
            </Group>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}

// ------------------------------------------------------------------
// Form aggiunta prodotto
// ------------------------------------------------------------------
function AddItemForm({
  groupId,
  listId,
  onAdded,
}: {
  groupId: string;
  listId: string;
  onAdded: (item: ShoppingItemDTO) => void;
}) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState<number | string>(1);
  const [unit, setUnit] = useState("");
  const [note, setNote] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Carica suggerimenti iniziali
  useEffect(() => {
    getProductSuggestions(groupId, "").then(setSuggestions);
  }, [groupId]);

  const handleNameChange = (val: string) => {
    setName(val);
    getProductSuggestions(groupId, val).then(setSuggestions);
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await addShoppingItem(groupId, listId, {
        name: trimmed,
        quantity: Number(qty) || 1,
        unit,
        note,
      });

      if (result.success && result.item) {
        onAdded(result.item);
        setName("");
        setQty(1);
        setUnit("");
        setNote("");
        inputRef.current?.focus();
      } else {
        notifications.show({ color: "red", message: "Errore nell'aggiunta" });
      }
    });
  };

  return (
    <Paper p="sm" withBorder style={{ borderStyle: "dashed" }}>
      <Stack gap="xs">
        <Group gap="xs" align="flex-end">
          <Autocomplete
            ref={inputRef}
            placeholder="Aggiungi prodotto…"
            value={name}
            onChange={handleNameChange}
            onOptionSubmit={(val) => setName(val)}
            data={suggestions}
            style={{ flex: 1 }}
            size="sm"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <NumberInput
            placeholder="Qtà"
            value={qty}
            onChange={setQty}
            min={0}
            size="sm"
            w={70}
          />
          <TextInput
            placeholder="Unità"
            value={unit}
            onChange={(e) => setUnit(e.currentTarget.value)}
            size="sm"
            w={70}
          />
        </Group>
        <Group gap="xs" align="flex-end">
          <TextInput
            placeholder="Note (es. marca, variante…)"
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            size="sm"
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button
            size="sm"
            leftSection={<IconPlus size={14} />}
            onClick={handleSubmit}
            loading={isPending}
            disabled={!name.trim()}
          >
            Aggiungi
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

// ------------------------------------------------------------------
// Componente principale
// ------------------------------------------------------------------
export function ShoppingListView({
  list: initialList,
}: {
  list: ShoppingListDetailDTO;
}) {
  const [items, setItems] = useState(initialList.items);
  const isCompleted = initialList.status === "completed";

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const handleAdded = (item: ShoppingItemDTO) => {
    setItems((prev) => [item, ...prev]);
  };

  return (
    <Stack maw={600} mx="auto" p="md" gap="lg">
      {/* Header */}
      <Stack gap={4}>
        <Anchor
          component={Link}
          href={`/spesa/${initialList.groupId}`}
          size="xs"
          c="dimmed"
        >
          ← {initialList.groupName}
        </Anchor>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <IconShoppingCart size={20} />
            <Text fw={700} size="lg">
              {initialList.name}
            </Text>
          </Group>
          {isCompleted ? (
            <Badge color="green" variant="light">
              Completata
            </Badge>
          ) : (
            <Badge color="blue" variant="light">
              {unchecked.length} rimasti
            </Badge>
          )}
        </Group>
      </Stack>

      {/* Form aggiunta — solo se lista aperta */}
      {!isCompleted && (
        <AddItemForm
          groupId={initialList.groupId}
          listId={initialList.id}
          onAdded={handleAdded}
        />
      )}

      {/* Lista vuota */}
      {items.length === 0 && (
        <Center py={40}>
          <Stack align="center" gap="xs">
            <IconShoppingCart size={32} color="var(--mantine-color-dimmed)" />
            <Text c="dimmed" size="sm">
              Nessun prodotto. Aggiungine uno sopra!
            </Text>
          </Stack>
        </Center>
      )}

      {/* Prodotti da prendere */}
      {unchecked.length > 0 && (
        <Stack gap="xs">
          {unchecked.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              groupId={initialList.groupId}
              listId={initialList.id}
              isCompleted={isCompleted}
              members={initialList.members}
            />
          ))}
        </Stack>
      )}

      {/* Divider se ci sono sia checked che unchecked */}
      {unchecked.length > 0 && checked.length > 0 && (
        <Divider
          label={
            <Text size="xs" c="dimmed">
              Nel carrello ({checked.length})
            </Text>
          }
          labelPosition="left"
        />
      )}

      {/* Prodotti già presi */}
      {checked.length > 0 && (
        <Stack gap="xs">
          {checked.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              groupId={initialList.groupId}
              listId={initialList.id}
              isCompleted={isCompleted}
              members={initialList.members}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

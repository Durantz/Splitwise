"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import {
  Stack,
  Title,
  TextInput,
  Table,
  Select,
  Button,
  ActionIcon,
  Group,
  Text,
  Pagination,
  Modal,
  Badge,
  Center,
  Loader,
  Tabs,
  NumberInput,
  Checkbox,
  Divider,
  Paper,
  ScrollArea,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconSearch,
  IconTrash,
  IconWand,
  IconPlus,
  IconPencil,
} from "@tabler/icons-react";
import { CATEGORIES, getCategoryColor } from "@/lib/categories";
import {
  TransactionCategoryDTO,
  CategoryRuleDTO,
  updateTransactionCategory,
  deleteTransactionCategory,
  getTransactionCategories,
  getCategoryRules,
  createCategoryRule,
  updateCategoryRule,
  deleteCategoryRule,
  previewRuleMatches,
  createRuleAndDeleteMatches,
} from "./server";

const PAGE_SIZE = 20;

const CATEGORY_SELECT_DATA = CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
}));

// ── Tab Mappings ─────────────────────────────────────────────────────────────

interface MappingsTabProps {
  initialItems: TransactionCategoryDTO[];
  initialTotal: number;
  onCreateRule: (item: TransactionCategoryDTO) => void;
}

interface RowState {
  category: string;
  saving: boolean;
}

function MappingsTab({
  initialItems,
  initialTotal,
  onCreateRule,
}: MappingsTabProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<TransactionCategoryDTO[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loadingPage, startPageTransition] = useTransition();
  const [rowStates, setRowStates] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      initialItems.map((item) => [
        item.id,
        { category: item.category, saving: false },
      ])
    )
  );
  const [deleteTarget, setDeleteTarget] =
    useState<TransactionCategoryDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPage = useCallback((newPage: number, newSearch: string) => {
    startPageTransition(async () => {
      const result = await getTransactionCategories(
        newSearch,
        newPage,
        PAGE_SIZE
      );
      setItems(result.items);
      setTotal(result.total);
      setRowStates(
        Object.fromEntries(
          result.items.map((item) => [
            item.id,
            { category: item.category, saving: false },
          ])
        )
      );
    });
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchPage(1, value);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPage(newPage, debouncedSearch);
  };

  const handleCategoryChange = (id: string, value: string | null) => {
    if (!value) return;
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], category: value },
    }));
  };

  const handleSave = async (item: TransactionCategoryDTO) => {
    const newCategory = rowStates[item.id]?.category;
    if (!newCategory || newCategory === item.category) return;
    setRowStates((prev) => ({
      ...prev,
      [item.id]: { ...prev[item.id], saving: true },
    }));
    try {
      await updateTransactionCategory(item.id, newCategory);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, category: newCategory } : i
        )
      );
      notifications.show({ message: "Categoria aggiornata", color: "teal" });
    } catch {
      notifications.show({
        message: "Errore durante il salvataggio",
        color: "red",
      });
    } finally {
      setRowStates((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], saving: false },
      }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTransactionCategory(deleteTarget.id);
      notifications.show({ message: "Voce eliminata", color: "teal" });
      setDeleteTarget(null);
      fetchPage(page, debouncedSearch);
    } catch {
      notifications.show({
        message: "Errore durante l'eliminazione",
        color: "red",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Stack gap="md">
      <TextInput
        placeholder="Cerca per descrizione…"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => handleSearchChange(e.currentTarget.value)}
        w={{ base: "100%", sm: 320 }}
      />

      {loadingPage ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : items.length === 0 ? (
        <Text c="dimmed" py="xl" ta="center">
          Nessuna voce trovata.
        </Text>
      ) : (
        <>
          <Table.ScrollContainer minWidth={480}>
            <Table withTableBorder withRowBorders verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Descrizione</Table.Th>
                  <Table.Th w={220}>Categoria</Table.Th>
                  <Table.Th w={140}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item) => {
                  const state = rowStates[item.id] ?? {
                    category: item.category,
                    saving: false,
                  };
                  const isDirty = state.category !== item.category;
                  return (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Text size="sm" style={{ wordBreak: "break-word" }}>
                          {item.normalizedDescription}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Select
                          data={CATEGORY_SELECT_DATA}
                          value={state.category}
                          onChange={(val) => handleCategoryChange(item.id, val)}
                          size="xs"
                          allowDeselect={false}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap" justify="flex-end">
                          {isDirty && (
                            <Button
                              size="xs"
                              loading={state.saving}
                              onClick={() => handleSave(item)}
                            >
                              Salva
                            </Button>
                          )}
                          <ActionIcon
                            color="blue"
                            variant="subtle"
                            size="sm"
                            onClick={() => onCreateRule(item)}
                            aria-label="Crea regola"
                            title="Crea regola da questo mapping"
                          >
                            <IconWand size={15} />
                          </ActionIcon>
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            size="sm"
                            onClick={() => setDeleteTarget(item)}
                            aria-label="Elimina"
                          >
                            <IconTrash size={15} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              {total} voci
            </Text>
            {totalPages > 1 && (
              <Pagination
                value={page}
                onChange={handlePageChange}
                total={totalPages}
                size="sm"
              />
            )}
          </Group>
        </>
      )}

      <Modal
        opened={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title="Elimina voce"
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Sei sicuro di voler eliminare il mapping per{" "}
            <Text span fw={600}>
              {deleteTarget?.normalizedDescription}
            </Text>
            ?
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Annulla
            </Button>
            <Button
              color="red"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
            >
              Elimina
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

// ── Tab Regole ───────────────────────────────────────────────────────────────

interface RulesTabProps {
  rules: CategoryRuleDTO[];
  onRefresh: () => Promise<void>;
}

function RulesTab({ rules, onRefresh }: RulesTabProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryRuleDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRuleDTO | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCategoryRule(deleteTarget.id);
      notifications.show({ message: "Regola eliminata", color: "teal" });
      setDeleteTarget(null);
      await onRefresh();
    } catch {
      notifications.show({
        message: "Errore durante l'eliminazione",
        color: "red",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="flex-end">
        <Button
          size="sm"
          leftSection={<IconPlus size={16} />}
          onClick={() => setAddOpen(true)}
        >
          Nuova regola
        </Button>
      </Group>

      {rules.length === 0 ? (
        <Text c="dimmed" py="xl" ta="center">
          Nessuna regola. Creane una dalla tab Mappings o con il pulsante qui
          sopra.
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={480}>
          <Table withTableBorder withRowBorders verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Pattern</Table.Th>
                <Table.Th w={160}>Categoria</Table.Th>
                <Table.Th w={70} ta="center">
                  Priorità
                </Table.Th>
                <Table.Th w={90} ta="center">
                  Override
                </Table.Th>
                <Table.Th w={80}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rules.map((rule) => (
                <Table.Tr key={rule.id}>
                  <Table.Td>
                    <Text size="sm" ff="monospace">
                      {rule.pattern}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={getCategoryColor(rule.category)}
                      variant="light"
                      size="sm"
                    >
                      {CATEGORIES.find((c) => c.value === rule.category)
                        ?.label ?? rule.category}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Text size="sm">{rule.priority}</Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Text size="sm" c={rule.overridesExact ? "blue" : "dimmed"}>
                      {rule.overridesExact ? "Sì" : "No"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => setEditTarget(rule)}
                        aria-label="Modifica"
                      >
                        <IconPencil size={15} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        size="sm"
                        onClick={() => setDeleteTarget(rule)}
                        aria-label="Elimina"
                      >
                        <IconTrash size={15} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      {/* Modal nuova regola */}
      <RuleFormModal
        opened={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={async () => {
          setAddOpen(false);
          await onRefresh();
        }}
      />

      {/* Modal modifica regola */}
      {editTarget && (
        <RuleFormModal
          opened={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={async () => {
            setEditTarget(null);
            await onRefresh();
          }}
          existing={editTarget}
        />
      )}

      {/* Modal conferma eliminazione */}
      <Modal
        opened={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title="Elimina regola"
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Elimina la regola per il pattern{" "}
            <Text span fw={600} ff="monospace">
              {deleteTarget?.pattern}
            </Text>
            ?
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Annulla
            </Button>
            <Button
              color="red"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
            >
              Elimina
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

// ── Modal form regola (nuovo / modifica) ─────────────────────────────────────

interface RuleFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  existing?: CategoryRuleDTO;
  prefillPattern?: string;
  prefillCategory?: string;
}

function RuleFormModal({
  opened,
  onClose,
  onSaved,
  existing,
  prefillPattern = "",
  prefillCategory = "",
}: RuleFormModalProps) {
  const [pattern, setPattern] = useState(existing?.pattern ?? prefillPattern);
  const [category, setCategory] = useState(
    existing?.category ?? prefillCategory
  );
  const [priority, setPriority] = useState<number>(existing?.priority ?? 10);
  const [overridesExact, setOverridesExact] = useState(
    existing?.overridesExact ?? false
  );
  const [saving, setSaving] = useState(false);

  const [debouncedPattern] = useDebouncedValue(pattern, 400);
  const [preview, setPreview] = useState<TransactionCategoryDTO[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Reset quando si apre il modal
  useEffect(() => {
    if (opened) {
      setPattern(existing?.pattern ?? prefillPattern);
      setCategory(existing?.category ?? prefillCategory);
      setPriority(existing?.priority ?? 10);
      setOverridesExact(existing?.overridesExact ?? false);
      setPreview([]);
    }
  }, [opened]);

  // Preview live al cambio pattern (solo in modalità crea/crea-da-mapping)
  useEffect(() => {
    if (!debouncedPattern.trim() || existing) {
      setPreview([]);
      return;
    }
    setLoadingPreview(true);
    previewRuleMatches(debouncedPattern).then((results) => {
      setPreview(results);
      setLoadingPreview(false);
    });
  }, [debouncedPattern, existing]);

  const handleSave = async () => {
    if (!pattern.trim() || !category) return;
    setSaving(true);
    try {
      if (existing) {
        await updateCategoryRule(existing.id, {
          pattern,
          category,
          priority,
          overridesExact,
        });
        notifications.show({ message: "Regola aggiornata", color: "teal" });
      } else {
        const result = await createRuleAndDeleteMatches({
          pattern,
          category,
          priority,
          overridesExact,
        });
        notifications.show({
          message: `Regola creata. ${result.deletedCount} mapping eliminati.`,
          color: "teal",
        });
      }
      onSaved();
      onClose();
    } catch {
      notifications.show({
        message: "Errore durante il salvataggio",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const isNew = !existing;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={existing ? "Modifica regola" : "Nuova regola"}
      size="md"
      centered
    >
      <Stack gap="md">
        <TextInput
          label="Pattern"
          description='Usa * come wildcard. Es: "paypal*", "*netflix*", "*rata*"'
          placeholder="es. paypal*"
          value={pattern}
          onChange={(e) => setPattern(e.currentTarget.value)}
        />

        <Select
          label="Categoria"
          data={CATEGORY_SELECT_DATA}
          value={category || null}
          onChange={(val) => val && setCategory(val)}
          allowDeselect={false}
        />

        <Group grow>
          <NumberInput
            label="Priorità"
            description="Numero più basso = applicata prima"
            min={1}
            max={999}
            value={priority}
            onChange={(val) => setPriority(Number(val))}
          />
          <Checkbox
            label="Override mapping esatto"
            description="Vince anche se esiste un mapping preciso"
            checked={overridesExact}
            onChange={(e) => setOverridesExact(e.target.checked)}
            mt="xl"
          />
        </Group>

        {/* Preview mapping che verranno eliminati — solo in modalità crea */}
        {isNew && (
          <>
            <Divider
              label="Mapping che verranno eliminati"
              labelPosition="left"
            />
            {loadingPreview ? (
              <Center py="xs">
                <Loader size="xs" />
              </Center>
            ) : preview.length === 0 ? (
              <Text size="sm" c="dimmed">
                {debouncedPattern.trim()
                  ? "Nessun mapping corrisponde a questo pattern."
                  : "Inserisci un pattern per vedere l'anteprima."}
              </Text>
            ) : (
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  {preview.length} mapping verranno eliminati:
                </Text>
                <ScrollArea h={150}>
                  <Stack gap={4}>
                    {preview.map((m) => (
                      <Paper key={m.id} px="sm" py={4} withBorder>
                        <Group justify="space-between" wrap="nowrap">
                          <Text
                            size="xs"
                            style={{ wordBreak: "break-word", flex: 1 }}
                          >
                            {m.normalizedDescription}
                          </Text>
                          <Badge
                            color={getCategoryColor(m.category)}
                            variant="light"
                            size="xs"
                            style={{ flexShrink: 0 }}
                          >
                            {CATEGORIES.find((c) => c.value === m.category)
                              ?.label ?? m.category}
                          </Badge>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </ScrollArea>
              </Stack>
            )}
          </>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={saving}>
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!pattern.trim() || !category}
          >
            {existing
              ? "Salva modifiche"
              : preview.length > 0
              ? `Crea regola ed elimina ${preview.length} mapping`
              : "Crea regola"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// ── Componente principale ────────────────────────────────────────────────────

interface Props {
  initialItems: TransactionCategoryDTO[];
  initialTotal: number;
  initialRules: CategoryRuleDTO[];
}

export default function EditCategoriesClient({
  initialItems,
  initialTotal,
  initialRules,
}: Props) {
  const [createRuleFrom, setCreateRuleFrom] =
    useState<TransactionCategoryDTO | null>(null);
  const [rules, setRules] = useState<CategoryRuleDTO[]>(initialRules);

  const refreshRules = async () => {
    const updated = await getCategoryRules();
    setRules(updated);
  };

  return (
    <Stack gap="md">
      <Title order={2}>Categorie movimenti</Title>

      <Tabs defaultValue="mappings">
        <Tabs.List mb="md">
          <Tabs.Tab value="mappings">Mappings</Tabs.Tab>
          <Tabs.Tab value="rules">
            Regole{rules.length > 0 ? ` (${rules.length})` : ""}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="mappings">
          <MappingsTab
            initialItems={initialItems}
            initialTotal={initialTotal}
            onCreateRule={(item) => setCreateRuleFrom(item)}
          />
        </Tabs.Panel>

        <Tabs.Panel value="rules">
          <RulesTab rules={rules} onRefresh={refreshRules} />
        </Tabs.Panel>
      </Tabs>

      {createRuleFrom && (
        <RuleFormModal
          opened={!!createRuleFrom}
          onClose={() => setCreateRuleFrom(null)}
          onSaved={async () => {
            setCreateRuleFrom(null);
            await refreshRules();
          }}
          prefillPattern={`${createRuleFrom.normalizedDescription}*`}
          prefillCategory={createRuleFrom.category}
        />
      )}
    </Stack>
  );
}

"use client";

import {
  Modal,
  Stack,
  Group,
  Avatar,
  Text,
  NumberInput,
  Select,
  TextInput,
  Textarea,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { createSettlement } from "@/app/(app)/settlements/server";
import {
  PAYMENT_METHOD_META,
  type PaymentMethod,
  type PairBalance,
} from "@/types";
import { formatCurrency } from "@/lib/format";
import "dayjs/locale/it";

const PAYMENT_METHODS = Object.entries(PAYMENT_METHOD_META) as [
  PaymentMethod,
  (typeof PAYMENT_METHOD_META)[PaymentMethod]
][];

interface Props {
  groupId: string;
  currency: string;
  pair: PairBalance; // la coppia verso cui sto pagando
  opened: boolean;
  onClose: () => void;
}

export default function SettleModal({
  groupId,
  currency,
  pair,
  opened,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);

  // pair.netAmount < 0 => io devo a pair.user
  const iOwe = pair.netAmount < 0;
  const defaultAmount = Math.abs(pair.netAmount);

  const form = useForm({
    initialValues: {
      amount: defaultAmount,
      paymentMethod: "bank" as PaymentMethod,
      paymentId: "",
      paidAt: new Date(),
      note: "",
    },
    validate: {
      amount: (v: number) => (v <= 0 ? "Importo non valido" : null),
    },
  });

  async function handleSubmit(values: typeof form.values) {
    if (!iOwe) return; // solo il debitore può registrare il pagamento
    setLoading(true);
    try {
      await createSettlement({
        groupId,
        toUserId: pair.user.id,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        paymentId: values.paymentId || undefined,
        paidAt: values.paidAt.toISOString(),
        note: values.note || undefined,
      });
      notifications.show({ message: "Pagamento registrato!", color: "teal" });
      form.reset();
      onClose();
    } catch {
      notifications.show({
        message: "Errore durante il salvataggio",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Registra pagamento"
      size="sm"
      centered
    >
      <Stack gap="md">
        {/* Riepilogo coppia */}
        <Group
          gap="sm"
          p="sm"
          style={(t) => ({
            background: t.colors.gray[0],
            borderRadius: t.radius.sm,
          })}
        >
          <Avatar
            src={pair.user.image}
            size={36}
            radius="xl"
            name={pair.user.name}
          />
          <Stack gap={2}>
            <Text size="sm" fw={600}>
              {pair.user.name}
            </Text>
            <Text size="xs" c={iOwe ? "red" : "teal"}>
              {iOwe
                ? `Devi ${formatCurrency(defaultAmount, currency)}`
                : `Ti deve ${formatCurrency(defaultAmount, currency)}`}
            </Text>
          </Stack>
        </Group>

        {!iOwe ? (
          <Text size="sm" c="dimmed">
            Solo {pair.user.name} può registrare questo pagamento, in quanto è
            lui/lei il debitore.
          </Text>
        ) : (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <NumberInput
                label="Importo pagato"
                min={0.01}
                decimalScale={2}
                fixedDecimalScale
                prefix={currency === "EUR" ? "€" : currency + " "}
                {...form.getInputProps("amount")}
              />

              <Group grow>
                <Select
                  label="Mezzo di pagamento"
                  data={PAYMENT_METHODS.map(([value, meta]) => ({
                    value,
                    label: `${meta.icon} ${meta.label}`,
                  }))}
                  {...form.getInputProps("paymentMethod")}
                />
                <DateInput
                  label="Data pagamento"
                  locale="it"
                  valueFormat="DD/MM/YYYY"
                  {...form.getInputProps("paidAt")}
                />
              </Group>

              <TextInput
                label="ID transazione"
                placeholder="Facoltativo — es. numero bonifico"
                {...form.getInputProps("paymentId")}
              />

              <Textarea
                label="Note"
                placeholder="Facoltativo"
                rows={2}
                {...form.getInputProps("note")}
              />

              <Group justify="flex-end">
                <Button variant="subtle" onClick={onClose}>
                  Annulla
                </Button>
                <Button type="submit" loading={loading} color="teal">
                  Conferma pagamento
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Stack>
    </Modal>
  );
}

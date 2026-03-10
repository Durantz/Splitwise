"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import {
  RecurringExpense,
  type RecurringFrequency,
} from "@/lib/models/RecurringExpense";
import { requireSession } from "@/lib/session";
import type { ExpenseCategory } from "@/types";
import { sendPushToUser } from "../notifications/server";

const FREQUENCY_LABEL: Record<string, string> = {
  daily: "ogni giorno",
  weekly: "ogni settimana",
  monthly: "ogni mese",
  yearly: "ogni anno",
};

// ── DTO ────────────────────────────────────────────────────────────────────

export interface RecurringExpenseDTO {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string; // ISO string
  endDate?: string; // ISO string
  lastGeneratedAt: string;
  active: boolean;
  paidBy: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  splits: Array<{
    userId: string;
    userName: string;
    userImage?: string;
    percentage: number;
    amount: number;
  }>;
  notes?: string;
}

// ── Read ───────────────────────────────────────────────────────────────────

export async function getRecurringExpenses(
  groupId: string
): Promise<RecurringExpenseDTO[]> {
  await connectDB();

  const list = await RecurringExpense.find({
    groupId: new mongoose.Types.ObjectId(groupId),
  })
    .sort({ createdAt: -1 })
    .populate("paidBy", "name email image")
    .populate("splits.userId", "name email image")
    .lean();

  return list.map(toDTO);
}

// ── Create ─────────────────────────────────────────────────────────────────

export interface CreateRecurringExpenseInput {
  groupId: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string; // ISO string
  endDate?: string; // ISO string
  paidBy: string;
  splits: Array<{ userId: string; percentage: number; amount: number }>;
  notes?: string;
}

export async function createRecurringExpense(
  input: CreateRecurringExpenseInput
): Promise<void> {
  await requireSession();
  await connectDB();

  const start = new Date(input.startDate);
  start.setHours(0, 0, 0, 0);

  // lastGeneratedAt = giorno prima di startDate,
  // così la prima occorrenza viene generata subito al prossimo getExpenses()
  const lastGeneratedAt = new Date(start);
  lastGeneratedAt.setDate(lastGeneratedAt.getDate() - 1);

  await RecurringExpense.create({
    groupId: new mongoose.Types.ObjectId(input.groupId),
    paidBy: new mongoose.Types.ObjectId(input.paidBy),
    description: input.description,
    category: input.category,
    amount: input.amount,
    frequency: input.frequency,
    startDate: start,
    endDate: input.endDate ? new Date(input.endDate) : undefined,
    lastGeneratedAt,
    splits: input.splits.map((s) => ({
      userId: new mongoose.Types.ObjectId(s.userId),
      percentage: s.percentage,
      amount: s.amount,
    })),
    notes: input.notes || undefined,
    active: true,
  });

  revalidatePath(`/groups/${input.groupId}`);
  revalidatePath("/dashboard");

  const session = await requireSession(); // già presente sopra
  const payerName = session.user.name ?? "Qualcuno";
  const otherUserIds = input.splits
    .map((s) => s.userId)
    .filter((id) => id !== input.paidBy);

  await Promise.allSettled(
    otherUserIds.map((userId) =>
      sendPushToUser(userId, {
        title: "Nuova spesa ricorrente 🔁",
        body: `${payerName} ha aggiunto "${input.description}" (${
          FREQUENCY_LABEL[input.frequency]
        })`,
        url: `/groups/${input.groupId}`,
      })
    )
  );
}

// ── Toggle attiva/disattiva ────────────────────────────────────────────────

export async function toggleRecurringExpense(
  recurringId: string,
  groupId: string
): Promise<void> {
  await requireSession();
  await connectDB();

  const doc = await RecurringExpense.findById(recurringId);
  if (!doc) throw new Error("Spesa ricorrente non trovata");

  doc.active = !doc.active;
  await doc.save();

  revalidatePath(`/groups/${groupId}`);
}

// ── Delete ─────────────────────────────────────────────────────────────────

export async function deleteRecurringExpense(
  recurringId: string,
  groupId: string
): Promise<void> {
  await requireSession();
  await connectDB();

  await RecurringExpense.findByIdAndDelete(recurringId);

  revalidatePath(`/groups/${groupId}`);
}

// ── Mapper ─────────────────────────────────────────────────────────────────

function toDTO(e: any): RecurringExpenseDTO {
  return {
    id: e._id.toString(),
    description: e.description,
    category: e.category,
    amount: e.amount,
    frequency: e.frequency,
    startDate: toISO(e.startDate),
    endDate: e.endDate ? toISO(e.endDate) : undefined,
    lastGeneratedAt: toISO(e.lastGeneratedAt),
    active: e.active,
    paidBy: {
      id: e.paidBy._id?.toString() ?? e.paidBy.toString(),
      name: e.paidBy.name ?? "—",
      email: e.paidBy.email ?? "",
      image: e.paidBy.image,
    },
    splits: (e.splits ?? []).map((s: any) => ({
      userId: s.userId._id?.toString() ?? s.userId.toString(),
      userName: s.userId.name ?? "—",
      userImage: s.userId.image,
      percentage: s.percentage,
      amount: s.amount,
    })),
    notes: e.notes,
  };
}

function toISO(d: any): string {
  return d instanceof Date ? d.toISOString() : d;
}

"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { Expense } from "@/lib/models/Expense";
import { requireSession } from "@/lib/session";
import type { ExpenseDTO, ExpenseCategory } from "@/types";
import mongoose from "mongoose";

export interface CreateExpenseInput {
  groupId: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paidBy: string;
  splits: Array<{ userId: string; percentage: number; amount: number }>;
  notes?: string;
}

export async function getExpenses(groupId: string): Promise<ExpenseDTO[]> {
  await connectDB();
  const expenses = await Expense.find({ groupId: new mongoose.Types.ObjectId(groupId) })
    .sort({ date: -1, createdAt: -1 })
    .populate("paidBy", "name email image")
    .populate("splits.userId", "name email image")
    .lean();
  return expenses.map(toExpenseDTO);
}

export async function createExpense(input: CreateExpenseInput) {
  await requireSession();
  await connectDB();

  await Expense.create({
    groupId: input.groupId,
    paidBy: input.paidBy,
    description: input.description,
    category: input.category,
    amount: input.amount,
    date: new Date(input.date),
    splits: input.splits.map((s) => ({
      userId: s.userId,
      percentage: s.percentage,
      amount: s.amount,
      settled: false,
    })),
    notes: input.notes || undefined,
  });

  revalidatePath(`/groups/${input.groupId}`);
  revalidatePath("/dashboard");
}

export async function markSplitSettled(expenseId: string, userId: string, groupId: string) {
  await requireSession();
  await connectDB();
  await Expense.updateOne(
    { _id: expenseId, "splits.userId": userId },
    { $set: { "splits.$.settled": true, "splits.$.settledAt": new Date() } }
  );
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
}

export async function deleteExpense(expenseId: string, groupId: string) {
  await requireSession();
  await connectDB();
  await Expense.findByIdAndDelete(expenseId);
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
}

function toExpenseDTO(e: any): ExpenseDTO {
  return {
    id: e._id.toString(),
    description: e.description,
    category: e.category,
    amount: e.amount,
    date: e.date instanceof Date ? e.date.toISOString() : e.date,
    notes: e.notes,
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
      settled: s.settled,
    })),
  };
}

"use server";

import { connectDB } from "@/lib/db/mongoose";
import { Expense } from "@/lib/models/Expense";
import { requireSession } from "@/lib/session";
import { currentMonthRange } from "@/lib/format";
import type { DashboardData, UserDTO } from "@/types";
import mongoose from "mongoose";

export async function getDashboardData(
  groupId: string
): Promise<DashboardData> {
  const session = await requireSession();
  await connectDB();

  const gId = new mongoose.Types.ObjectId(groupId);
  const { start, end, label } = currentMonthRange();

  // ── Spese del mese per i KPI in cima ──────────────────────────────────
  const monthlyExpenses = await Expense.find({
    groupId: gId,
    date: { $gte: start, $lte: end },
  }).lean();

  const monthlyCount = monthlyExpenses.length;
  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  // ── Tutte le spese per calcolare i bilanci ────────────────────────────
  const allExpenses = await Expense.find({ groupId: gId })
    .populate("paidBy", "name email image")
    .populate("splits.userId", "name email image")
    .lean();

  // Per ogni altra persona: quanto mi deve (positivo) o gli devo (negativo)
  const balanceMap = new Map<string, { user: UserDTO; amount: number }>();

  function addToBalance(user: UserDTO, delta: number) {
    const prev = balanceMap.get(user.id)?.amount ?? 0;
    balanceMap.set(user.id, { user, amount: prev + delta });
  }

  for (const expense of allExpenses) {
    const payer = expense.paidBy as any;
    const iAmPayer = payer._id.toString() === session.user.id;

    for (const split of expense.splits) {
      if (split.settled) continue;
      const member = split.userId as any;
      const isMySplit = member._id.toString() === session.user.id;

      if (iAmPayer && !isMySplit) {
        // Ho pagato io, l'altro mi deve la sua quota
        addToBalance(toUserDTO(member), +split.amount);
      } else if (!iAmPayer && isMySplit) {
        // Ha pagato un altro, io gli devo la mia quota
        addToBalance(toUserDTO(payer), -split.amount);
      }
    }
  }

  // ── Costruisci il risultato ────────────────────────────────────────────
  const balances = Array.from(balanceMap.values())
    .map((b) => ({ ...b, amount: round2(b.amount) }))
    .filter((b) => Math.abs(b.amount) >= 0.01);

  const totalOwedToMe = balances
    .filter((b) => b.amount > 0)
    .reduce((sum, b) => sum + b.amount, 0);

  const totalIOwe = balances
    .filter((b) => b.amount < 0)
    .reduce((sum, b) => sum - b.amount, 0);

  return {
    monthLabel: label,
    monthlyCount,
    monthlyTotal: round2(monthlyTotal),
    totalOwedToMe: round2(totalOwedToMe),
    totalIOwe: round2(totalIOwe),
    netBalance: round2(totalOwedToMe - totalIOwe),
    balances,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function toUserDTO(u: any): UserDTO {
  return { id: u._id.toString(), name: u.name, email: u.email, image: u.image };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

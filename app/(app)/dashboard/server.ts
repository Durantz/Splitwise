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
  const myId = session.user.id;

  // Tutte le spese con split popolati (servono per entrambi i calcoli)
  const allExpenses = await Expense.find({ groupId: gId })
    .populate("paidBy", "name email image")
    .populate("splits.userId", "name email image")
    .lean();

  const balanceMap = new Map<string, { user: UserDTO; amount: number }>();

  let monthlyCount = 0;
  let monthlyTotal = 0;
  let monthlyOwedToMe = 0;
  let monthlyIOwe = 0;

  function addToBalance(user: UserDTO, delta: number) {
    const prev = balanceMap.get(user.id)?.amount ?? 0;
    balanceMap.set(user.id, { user, amount: prev + delta });
  }

  for (const expense of allExpenses) {
    const payer = expense.paidBy as any;
    const iAmPayer = payer._id.toString() === myId;
    const isThisMonth = expense.date >= start && expense.date <= end;

    // KPI mensili
    if (isThisMonth) {
      monthlyCount++;
      monthlyTotal += expense.amount;
    }

    for (const split of expense.splits) {
      if (split.settled) continue;
      const member = split.userId as any;
      const isMySplit = member._id.toString() === myId;

      if (iAmPayer && !isMySplit) {
        // Ho pagato io, l'altro mi deve
        addToBalance(toUserDTO(member), +split.amount);
        if (isThisMonth) monthlyOwedToMe += split.amount;
      } else if (!iAmPayer && isMySplit) {
        // Ha pagato un altro, io gli devo
        addToBalance(toUserDTO(payer), -split.amount);
        if (isThisMonth) monthlyIOwe += split.amount;
      }
    }
  }

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
    monthlyOwedToMe: round2(monthlyOwedToMe),
    monthlyIOwe: round2(monthlyIOwe),
    totalOwedToMe: round2(totalOwedToMe),
    totalIOwe: round2(totalIOwe),
    netBalance: round2(totalOwedToMe - totalIOwe),
    balances,
  };
}

function toUserDTO(u: any): UserDTO {
  return { id: u._id.toString(), name: u.name, email: u.email, image: u.image };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

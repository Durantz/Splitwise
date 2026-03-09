"use server";

import { connectDB } from "@/lib/db/mongoose";
import { Expense } from "@/lib/models/Expense";
import { Settlement } from "@/lib/models/Settlement";
import { User } from "@/lib/models/User";
import type { DashboardData, UserDTO, BalanceEntry } from "@/types";
import mongoose from "mongoose";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { it } from "date-fns/locale";

export async function getDashboardData(
  groupId: string,
  currentUserId: string
): Promise<DashboardData> {
  await connectDB();

  const gId = new mongoose.Types.ObjectId(groupId);
  const uId = new mongoose.Types.ObjectId(currentUserId);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [monthlyExpenses, allExpenses, settlements] = await Promise.all([
    Expense.find({ groupId: gId, date: { $gte: monthStart, $lte: monthEnd } }).lean(),
    Expense.find({ groupId: gId }).lean(),
    Settlement.find({ groupId: gId, $or: [{ from: uId }, { to: uId }] }).lean(),
  ]);

  const monthlyCount = monthlyExpenses.length;
  const monthlyTotal = monthlyExpenses.reduce((s, e) => s + e.amount, 0);

  // Mappa userId → saldo netto: positivo = mi deve, negativo = gli devo
  const netMap = new Map<string, number>();

  for (const expense of allExpenses) {
    const payerId = expense.paidBy.toString();
    const iAmPayer = payerId === currentUserId;

    for (const split of expense.splits) {
      if (split.settled) continue;
      const splitOwner = split.userId.toString();

      if (iAmPayer && splitOwner !== currentUserId) {
        netMap.set(splitOwner, (netMap.get(splitOwner) ?? 0) + split.amount);
      } else if (!iAmPayer && splitOwner === currentUserId) {
        netMap.set(payerId, (netMap.get(payerId) ?? 0) - split.amount);
      }
    }
  }

  for (const s of settlements) {
    const fromId = s.from.toString();
    const toId = s.to.toString();
    if (fromId === currentUserId) {
      netMap.set(toId, (netMap.get(toId) ?? 0) + s.amount);
    } else {
      netMap.set(fromId, (netMap.get(fromId) ?? 0) - s.amount);
    }
  }

  const otherIds = [...netMap.keys()].filter((id) => id !== currentUserId);
  const users = await User.find({
    _id: { $in: otherIds.map((id) => new mongoose.Types.ObjectId(id)) },
  }).select("name email image").lean();

  const userMap = new Map(users.map((u) => [(u._id as any).toString(), u]));

  const balances: BalanceEntry[] = [];
  let totalOwedToMe = 0;
  let totalIOwe = 0;

  for (const [uid, amount] of netMap.entries()) {
    const u = userMap.get(uid);
    if (!u || Math.abs(amount) < 0.01) continue;
    const user: UserDTO = { id: uid, name: u.name, email: u.email, image: u.image };
    balances.push({ user, amount: Math.round(amount * 100) / 100 });
    if (amount > 0) totalOwedToMe += amount;
    else totalIOwe += -amount;
  }

  return {
    monthlyCount,
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    totalOwedToMe: Math.round(totalOwedToMe * 100) / 100,
    totalIOwe: Math.round(totalIOwe * 100) / 100,
    netBalance: Math.round((totalOwedToMe - totalIOwe) * 100) / 100,
    balances,
    monthLabel: format(now, "MMMM yyyy", { locale: it }),
  };
}

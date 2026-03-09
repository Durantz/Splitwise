"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { Expense } from "@/lib/models/Expense";
import { Settlement } from "@/lib/models/Settlement";
import { requireSession } from "@/lib/session";
import type {
  PairBalance,
  PairExpenseRow,
  SettlementDTO,
  UserDTO,
} from "@/types";
import type { PaymentMethod } from "@/lib/models/Settlement";
import mongoose from "mongoose";

// ── Calcola il bilancio netto 1-a-1 tra l'utente corrente e tutti gli altri ──

export async function getPairBalances(groupId: string): Promise<PairBalance[]> {
  const session = await requireSession();
  await connectDB();

  const gId = new mongoose.Types.ObjectId(groupId);
  const myId = session.user.id;

  const expenses = await Expense.find({ groupId: gId })
    .populate("paidBy", "name email image")
    .populate("splits.userId", "name email image")
    .lean();

  // mappa otherId -> { user, netAmount, expenses }
  const pairMap = new Map<
    string,
    { user: UserDTO; netAmount: number; rows: PairExpenseRow[] }
  >();

  function getOrCreate(user: UserDTO) {
    if (!pairMap.has(user.id)) {
      pairMap.set(user.id, { user, netAmount: 0, rows: [] });
    }
    return pairMap.get(user.id)!;
  }

  for (const expense of expenses) {
    const payer = expense.paidBy as any;
    const payerId = payer._id.toString();
    const iAmPayer = payerId === myId;

    for (const split of expense.splits) {
      if (split.settled) continue;

      const member = split.userId as any;
      const memberId = member._id.toString();

      if (iAmPayer && memberId !== myId) {
        // Ho pagato io: il membro mi deve la sua quota
        const pair = getOrCreate(toUserDTO(member));
        pair.netAmount = round2(pair.netAmount + split.amount);
        pair.rows.push({
          expenseId: expense._id.toString(),
          description: expense.description,
          category: expense.category,
          date:
            expense.date instanceof Date
              ? expense.date.toISOString()
              : expense.date,
          totalAmount: expense.amount,
          myShare: split.amount,
          paidByMe: true,
        });
      } else if (!iAmPayer && memberId === myId) {
        // Ha pagato qualcun altro: io devo la mia quota a chi ha pagato
        const pair = getOrCreate(toUserDTO(payer));
        pair.netAmount = round2(pair.netAmount - split.amount);
        pair.rows.push({
          expenseId: expense._id.toString(),
          description: expense.description,
          category: expense.category,
          date:
            expense.date instanceof Date
              ? expense.date.toISOString()
              : expense.date,
          totalAmount: expense.amount,
          myShare: split.amount,
          paidByMe: false,
        });
      }
    }
  }

  return Array.from(pairMap.values())
    .filter((p) => Math.abs(p.netAmount) >= 0.01 || p.rows.length > 0)
    .map((p) => ({
      user: p.user,
      netAmount: p.netAmount,
      unsettledExpenses: p.rows,
    }))
    .sort((a, b) => a.netAmount - b.netAmount); // debiti prima, crediti dopo
}

// ── Crea un pagamento e segna come settled tutti gli split aperti tra i due ──

export interface CreateSettlementInput {
  groupId: string;
  toUserId: string; // chi riceve (il creditore)
  amount: number;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  paidAt: string;
  note?: string;
}

export async function createSettlement(
  input: CreateSettlementInput
): Promise<void> {
  const session = await requireSession();
  await connectDB();

  const gId = new mongoose.Types.ObjectId(input.groupId);
  const fromId = new mongoose.Types.ObjectId(session.user.id);
  const toId = new mongoose.Types.ObjectId(input.toUserId);
  const now = new Date();

  // Registra il pagamento
  await Settlement.create({
    groupId: gId,
    from: fromId,
    to: toId,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    paymentId: input.paymentId || undefined,
    paidAt: new Date(input.paidAt),
    note: input.note || undefined,
  });

  // Carica tutte le spese del gruppo che coinvolgono entrambi gli utenti
  // (sia come payer che come partecipante)
  const expenses = await Expense.find({
    groupId: gId,
    $or: [
      { paidBy: fromId, "splits.userId": toId },
      { paidBy: toId, "splits.userId": fromId },
    ],
  });

  // Per ciascuna spesa, chiudi tutti gli split aperti tra i due utenti
  // in entrambe le direzioni: se ha pagato fromId chiudi lo split di toId,
  // se ha pagato toId chiudi lo split di fromId.
  await Promise.all(
    expenses.map((expense) => {
      let changed = false;
      for (const split of expense.splits) {
        if (split.settled) continue;
        const uid = split.userId.toString();
        const payerId = expense.paidBy.toString();

        const closeThisSplit =
          // Spesa pagata dal creditore (toId): chiudi lo split del debitore (fromId)
          (payerId === toId.toString() && uid === fromId.toString()) ||
          // Spesa pagata dal debitore (fromId): chiudi lo split del creditore (toId)
          (payerId === fromId.toString() && uid === toId.toString());

        if (closeThisSplit) {
          split.settled = true;
          split.settledAt = now;
          changed = true;
        }
      }
      return changed ? expense.save() : Promise.resolve();
    })
  );

  revalidatePath(`/groups/${input.groupId}`);
  revalidatePath("/dashboard");
}

// ── Storico pagamenti tra me e un'altra persona ────────────────────────────

export async function getSettlementHistory(
  groupId: string,
  otherUserId: string
): Promise<SettlementDTO[]> {
  const session = await requireSession();
  await connectDB();

  const gId = new mongoose.Types.ObjectId(groupId);
  const myId = new mongoose.Types.ObjectId(session.user.id);
  const otherId = new mongoose.Types.ObjectId(otherUserId);

  const settlements = await Settlement.find({
    groupId: gId,
    $or: [
      { from: myId, to: otherId },
      { from: otherId, to: myId },
    ],
  })
    .populate("from", "name email image")
    .populate("to", "name email image")
    .sort({ paidAt: -1 })
    .lean();

  return settlements.map((s) => ({
    id: s._id.toString(),
    from: toUserDTO(s.from as any),
    to: toUserDTO(s.to as any),
    amount: s.amount,
    paymentMethod: s.paymentMethod,
    paymentId: s.paymentId,
    paidAt: s.paidAt instanceof Date ? s.paidAt.toISOString() : s.paidAt,
    note: s.note,
  }));
}

// ── Helpers ───────────────────────────────────────────────────────────────

function toUserDTO(u: any): UserDTO {
  return { id: u._id.toString(), name: u.name, email: u.email, image: u.image };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

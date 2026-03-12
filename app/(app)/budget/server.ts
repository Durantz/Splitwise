"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/session";
import { Transaction } from "@/lib/models/Transaction";
import { Period } from "@/lib/models/Period";
import { TransactionCategory } from "@/lib/models/TransactionCategory";
import mongoose from "mongoose";

// ------------------------------------------------------------------
// Tipi condivisi
// ------------------------------------------------------------------

export interface PeriodOption {
  id: string;
  label: string;
  from: string;
  to: string;
}

export interface CategoryStat {
  category: string;
  total: number;
  count: number;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  total: number;
}

export interface PeriodStats {
  categories: CategoryStat[];
  dailyTotals: DailyStat[];
  grandTotal: number;
}

// ------------------------------------------------------------------
// Import payload (usato da budget/import/server.ts tramite re-export
// dei modelli — le server actions di import stanno in import/server.ts)
// ------------------------------------------------------------------

export async function getPeriods(): Promise<PeriodOption[]> {
  const session = await requireSession();
  await connectDB();

  const periods = await Period.find({ userId: session.user.id })
    .sort({ from: -1 })
    .lean();

  return periods.map((p) => ({
    id: String(p._id),
    label: p.label,
    from: p.from.toISOString(),
    to: p.to.toISOString(),
  }));
}

export async function getPeriodStats(periodId: string): Promise<PeriodStats> {
  const session = await requireSession();
  await connectDB();

  const oid = new mongoose.Types.ObjectId(periodId);

  // Recupera le date del periodo per filtrare le transazioni fuori range
  const period = await Period.findOne({
    _id: oid,
    userId: session.user.id,
  }).lean();
  if (!period) return { categories: [], dailyTotals: [], grandTotal: 0 };

  const baseMatch = { userId: session.user.id, periodId: oid };
  const dateMatch = {
    userId: session.user.id,
    periodId: oid,
    date: { $gte: period.from, $lte: period.to },
  };

  const [byCategory, byDay] = await Promise.all([
    // Le categorie usano tutte le transazioni del periodo (incluse date valuta fuori range)
    Transaction.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: 1 } },
    ]),
    // Il grafico giornaliero filtra solo le transazioni dentro il range
    Transaction.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const categories: CategoryStat[] = byCategory.map((b) => ({
    category: b._id,
    total: b.total,
    count: b.count,
  }));

  const dailyTotals: DailyStat[] = byDay.map((b) => ({
    date: b._id,
    total: b.total,
  }));

  return {
    categories,
    dailyTotals,
    grandTotal: categories.reduce((acc, c) => acc + c.total, 0),
  };
}

export async function comparePeriods(
  periodAId: string,
  periodBId: string
): Promise<{ a: PeriodStats; b: PeriodStats }> {
  const [a, b] = await Promise.all([
    getPeriodStats(periodAId),
    getPeriodStats(periodBId),
  ]);
  return { a, b };
}

export async function deletePeriod(periodId: string): Promise<void> {
  const session = await requireSession();
  await connectDB();

  const oid = new mongoose.Types.ObjectId(periodId);
  await Promise.all([
    Period.deleteOne({ _id: oid, userId: session.user.id }),
    Transaction.deleteMany({ periodId: oid, userId: session.user.id }),
  ]);

  revalidatePath("/budget");
}

export async function getMappings(): Promise<Record<string, string>> {
  const session = await requireSession();
  await connectDB();

  const mappings = await TransactionCategory.find(
    { userId: session.user.id },
    { normalizedDescription: 1, category: 1, _id: 0 }
  ).lean();

  return Object.fromEntries(
    mappings.map((m) => [m.normalizedDescription, m.category])
  );
}

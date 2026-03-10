import mongoose from "mongoose";
import {
  RecurringExpense,
  type RecurringFrequency,
} from "@/lib/models/RecurringExpense";
import { Expense } from "@/lib/models/Expense";

/**
 * Calcola tutte le date di occorrenza tra `after` (esclusa) e `upTo` (inclusa)
 * in base alla frequenza.
 */
function getOccurrencesBetween(
  frequency: RecurringFrequency,
  after: Date,
  upTo: Date,
  startDate: Date
): Date[] {
  const dates: Date[] = [];

  // Partiamo dalla prima occorrenza successiva ad `after`
  const cursor = new Date(after);

  switch (frequency) {
    case "daily":
      cursor.setDate(cursor.getDate() + 1);
      break;
    case "weekly":
      cursor.setDate(cursor.getDate() + 7);
      break;
    case "monthly":
      cursor.setMonth(cursor.getMonth() + 1);
      // Mantieni il giorno del mese originale (es. 31 → ultimo giorno del mese)
      cursor.setDate(Math.min(startDate.getDate(), daysInMonth(cursor)));
      break;
    case "yearly":
      cursor.setFullYear(cursor.getFullYear() + 1);
      break;
  }

  // Normalizza a mezzanotte UTC per evitare drift
  normalizeToMidnight(cursor);

  while (cursor <= upTo) {
    dates.push(new Date(cursor));

    switch (frequency) {
      case "daily":
        cursor.setDate(cursor.getDate() + 1);
        break;
      case "weekly":
        cursor.setDate(cursor.getDate() + 7);
        break;
      case "monthly":
        cursor.setMonth(cursor.getMonth() + 1);
        cursor.setDate(Math.min(startDate.getDate(), daysInMonth(cursor)));
        break;
      case "yearly":
        cursor.setFullYear(cursor.getFullYear() + 1);
        break;
    }

    normalizeToMidnight(cursor);
  }

  return dates;
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function normalizeToMidnight(d: Date): void {
  d.setHours(0, 0, 0, 0);
}

/**
 * Materializza tutte le occorrenze pendenti per le spese ricorrenti di un gruppo.
 * Chiamata automaticamente prima di ogni getExpenses() così non serve nessun cron.
 *
 * È idempotente: se chiamata più volte non crea duplicati grazie a lastGeneratedAt.
 */
export async function materializeRecurring(groupId: string): Promise<void> {
  const gId = new mongoose.Types.ObjectId(groupId);
  const now = new Date();
  normalizeToMidnight(now);

  // Carica solo le ricorrenti attive del gruppo che hanno ancora occorrenze da generare
  const recurringList = await RecurringExpense.find({
    groupId: gId,
    active: true,
    startDate: { $lte: now },
    lastGeneratedAt: { $lt: now },
  }).lean();

  if (recurringList.length === 0) return;

  const expensesToInsert: any[] = [];
  const updates: Array<{ id: mongoose.Types.ObjectId; lastGeneratedAt: Date }> =
    [];

  for (const recurring of recurringList) {
    const upTo =
      recurring.endDate && recurring.endDate < now ? recurring.endDate : now;

    const dates = getOccurrencesBetween(
      recurring.frequency,
      recurring.lastGeneratedAt,
      upTo,
      recurring.startDate
    );

    if (dates.length === 0) continue;

    for (const date of dates) {
      expensesToInsert.push({
        groupId: recurring.groupId,
        paidBy: recurring.paidBy,
        description: recurring.description,
        category: recurring.category,
        amount: recurring.amount,
        date,
        splits: recurring.splits.map((s) => ({
          userId: s.userId,
          percentage: s.percentage,
          amount: s.amount,
          settled: false,
        })),
        notes: recurring.notes,
        recurringExpenseId: recurring._id,
      });
    }

    updates.push({
      id: recurring._id,
      lastGeneratedAt: dates[dates.length - 1],
    });
  }

  // Inserimento bulk + update lastGeneratedAt in parallelo
  await Promise.all([
    expensesToInsert.length > 0
      ? Expense.insertMany(expensesToInsert, { ordered: false })
      : Promise.resolve(),
    ...updates.map(({ id, lastGeneratedAt }) =>
      RecurringExpense.updateOne({ _id: id }, { $set: { lastGeneratedAt } })
    ),
  ]);
}

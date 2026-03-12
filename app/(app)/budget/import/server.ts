"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/session";
import { TransactionCategory } from "@/lib/models/TransactionCategory";
import { Transaction } from "@/lib/models/Transaction";
import { Period } from "@/lib/models/Period";

export interface ImportPayload {
  periodLabel: string;
  periodFrom: string; // ISO string
  periodTo: string; // ISO string
  newMappings: Array<{
    description: string;
    normalizedDescription: string;
    category: string;
  }>;
  transactions: Array<{
    date: string; // ISO string
    amount: number;
    category: string;
  }>;
}

export interface ImportResult {
  success: boolean;
  periodId?: string;
  savedTransactions?: number;
  savedMappings?: number;
  error?: string;
}

export async function importTransactions(
  payload: ImportPayload
): Promise<ImportResult> {
  const session = await requireSession();
  await connectDB();

  const userId = session.user.id;

  try {
    const period = await Period.create({
      userId,
      label: payload.periodLabel,
      from: new Date(payload.periodFrom),
      to: new Date(payload.periodTo),
    });

    let savedMappings = 0;
    if (payload.newMappings.length > 0) {
      const ops = payload.newMappings.map((m) => ({
        updateOne: {
          filter: { userId, normalizedDescription: m.normalizedDescription },
          update: {
            $setOnInsert: {
              userId,
              description: m.description,
              normalizedDescription: m.normalizedDescription,
              category: m.category,
            },
          },
          upsert: true,
        },
      }));
      const result = await TransactionCategory.bulkWrite(ops);
      savedMappings = result.upsertedCount;
    }

    await Transaction.insertMany(
      payload.transactions.map((t) => ({
        userId,
        periodId: period._id,
        date: new Date(t.date),
        amount: t.amount,
        category: t.category,
      }))
    );

    revalidatePath("/budget");

    return {
      success: true,
      periodId: String(period._id),
      savedTransactions: payload.transactions.length,
      savedMappings,
    };
  } catch (err) {
    console.error("importTransactions error:", err);
    return { success: false, error: "Errore durante il salvataggio" };
  }
}

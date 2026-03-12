"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/session";
import { TransactionCategory } from "@/lib/models/TransactionCategory";
import { CategoryRule } from "@/lib/models/CategoryRule";
import { patternToRegexString } from "@/lib/CategoryRuleUtils";

// ── DTOs ────────────────────────────────────────────────────────────────────

export interface TransactionCategoryDTO {
  id: string;
  description: string;
  normalizedDescription: string;
  category: string;
}

export interface CategoryRuleDTO {
  id: string;
  pattern: string;
  category: string;
  priority: number;
  overridesExact: boolean;
}

export interface GetCategoriesResult {
  items: TransactionCategoryDTO[];
  total: number;
}

// ── TransactionCategory actions ──────────────────────────────────────────────

export async function getTransactionCategories(
  search: string,
  page: number,
  pageSize: number
): Promise<GetCategoriesResult> {
  const session = await requireSession();
  await connectDB();

  const filter: Record<string, unknown> = { userId: session.user.id };
  if (search.trim()) {
    filter.normalizedDescription = { $regex: search.trim(), $options: "i" };
  }

  const [items, total] = await Promise.all([
    TransactionCategory.find(filter)
      .sort({ normalizedDescription: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    TransactionCategory.countDocuments(filter),
  ]);

  return {
    items: items.map((c) => ({
      id: String(c._id),
      description: c.description,
      normalizedDescription: c.normalizedDescription,
      category: c.category,
    })),
    total,
  };
}

export async function updateTransactionCategory(
  id: string,
  category: string
): Promise<void> {
  const session = await requireSession();
  await connectDB();
  await TransactionCategory.updateOne(
    { _id: id, userId: session.user.id },
    { $set: { category } }
  );
  revalidatePath("/budget/edit-categories");
}

export async function deleteTransactionCategory(id: string): Promise<void> {
  const session = await requireSession();
  await connectDB();
  await TransactionCategory.deleteOne({ _id: id, userId: session.user.id });
  revalidatePath("/budget/edit-categories");
}

// ── CategoryRule actions ─────────────────────────────────────────────────────

export async function getCategoryRules(): Promise<CategoryRuleDTO[]> {
  const session = await requireSession();
  await connectDB();

  const rules = await CategoryRule.find({ userId: session.user.id })
    .sort({ priority: 1 })
    .lean();

  return rules.map((r) => ({
    id: String(r._id),
    pattern: r.pattern,
    category: r.category,
    priority: r.priority,
    overridesExact: r.overridesExact,
  }));
}

export async function createCategoryRule(input: {
  pattern: string;
  category: string;
  priority: number;
  overridesExact: boolean;
}): Promise<void> {
  const session = await requireSession();
  await connectDB();
  await CategoryRule.create({ userId: session.user.id, ...input });
  revalidatePath("/budget/edit-categories");
}

export async function updateCategoryRule(
  id: string,
  input: Partial<{
    pattern: string;
    category: string;
    priority: number;
    overridesExact: boolean;
  }>
): Promise<void> {
  const session = await requireSession();
  await connectDB();
  await CategoryRule.updateOne(
    { _id: id, userId: session.user.id },
    { $set: input }
  );
  revalidatePath("/budget/edit-categories");
}

export async function deleteCategoryRule(id: string): Promise<void> {
  const session = await requireSession();
  await connectDB();
  await CategoryRule.deleteOne({ _id: id, userId: session.user.id });
  revalidatePath("/budget/edit-categories");
}

/**
 * Anteprima live: mapping che verranno eliminati per il pattern dato.
 */
export async function previewRuleMatches(
  pattern: string
): Promise<TransactionCategoryDTO[]> {
  const session = await requireSession();
  await connectDB();

  if (!pattern.trim()) return [];

  const regexStr = patternToRegexString(pattern);

  const matches = await TransactionCategory.find({
    userId: session.user.id,
    normalizedDescription: { $regex: regexStr, $options: "i" },
  })
    .sort({ normalizedDescription: 1 })
    .limit(50)
    .lean();

  return matches.map((c) => ({
    id: String(c._id),
    description: c.description,
    normalizedDescription: c.normalizedDescription,
    category: c.category,
  }));
}

/**
 * Crea una regola ed elimina tutti i mapping che matchano il pattern.
 */
export async function createRuleAndDeleteMatches(input: {
  pattern: string;
  category: string;
  priority: number;
  overridesExact: boolean;
}): Promise<{ deletedCount: number }> {
  const session = await requireSession();
  await connectDB();

  const regexStr = patternToRegexString(input.pattern);

  const [, deleteResult] = await Promise.all([
    CategoryRule.create({ userId: session.user.id, ...input }),
    TransactionCategory.deleteMany({
      userId: session.user.id,
      normalizedDescription: { $regex: regexStr, $options: "i" },
    }),
  ]);

  revalidatePath("/budget/edit-categories");

  return { deletedCount: deleteResult.deletedCount };
}

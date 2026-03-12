import { requireSession } from "@/lib/session";
import { getTransactionCategories, getCategoryRules } from "./server";
import EditCategoriesClient from "./EditCategoriesClient";

const PAGE_SIZE = 20;

export default async function EditCategoriesPage() {
  await requireSession();

  const [{ items, total }, rules] = await Promise.all([
    getTransactionCategories("", 1, PAGE_SIZE),
    getCategoryRules(),
  ]);

  return (
    <EditCategoriesClient
      initialItems={items}
      initialTotal={total}
      initialRules={rules}
    />
  );
}

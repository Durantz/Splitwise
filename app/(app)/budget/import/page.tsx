import { getMappings } from "@/app/(app)/budget/server";
import { ImportWizard } from "./ImportWizard";
import { getCategoryRules } from "../edit-categories/server";

export const metadata = { title: "Importa estratto conto" };

export default async function ImportPage() {
  const [existingMappings, rules] = await Promise.all([
    getMappings(),
    getCategoryRules(),
  ]);
  return <ImportWizard existingMappings={existingMappings} rules={rules} />;
}

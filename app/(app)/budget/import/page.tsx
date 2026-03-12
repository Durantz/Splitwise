import { getMappings } from "@/app/(app)/budget/server";
import { ImportWizard } from "./ImportWizard";

export const metadata = { title: "Importa estratto conto" };

export default async function ImportPage() {
  const existingMappings = await getMappings();
  return <ImportWizard existingMappings={existingMappings} />;
}

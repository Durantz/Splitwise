import { getPeriods } from "./server";
import { Spesometro } from "./Spesometro";

export const metadata = { title: "Budget" };

export default async function BudgetPage() {
  const periods = await getPeriods();
  return <Spesometro periods={periods} />;
}

import { Suspense } from "react";
import { getPeriods, PeriodOption } from "./server";
import { Spesometro } from "./Spesometro";
import { Center, Loader } from "@mantine/core";

export const dynamic = "force-dynamic";
export const metadata = { title: "Budget" };

async function BudgetContent() {
  let periods: PeriodOption[] = [];
  try {
    periods = await getPeriods();
  } catch (e) {
    console.error("getPeriods error:", e);
  }
  return <Spesometro periods={periods} />;
}

export default function BudgetPage() {
  return (
    <Suspense
      fallback={
        <Center h={200}>
          <Loader />
        </Center>
      }
    >
      <BudgetContent />
    </Suspense>
  );
}

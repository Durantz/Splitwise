import { Suspense } from "react";
import { Center, Loader } from "@mantine/core";
import { getMyShoppingGroups } from "./server";
import { ShoppingHomeView } from "./ShoppingHomeView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Spesa" };

async function Content() {
  const groups = await getMyShoppingGroups();
  return <ShoppingHomeView groups={groups} />;
}

export default function SpesaPage() {
  return (
    <Suspense
      fallback={
        <Center h={200}>
          <Loader />
        </Center>
      }
    >
      <Content />
    </Suspense>
  );
}

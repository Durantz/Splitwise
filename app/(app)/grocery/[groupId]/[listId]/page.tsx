import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Center, Loader } from "@mantine/core";
import { getShoppingListDetail } from "./server";
import { ShoppingListView } from "./ShoppingListView";

export const dynamic = "force-dynamic";

async function Content({
  groupId,
  listId,
}: {
  groupId: string;
  listId: string;
}) {
  const list = await getShoppingListDetail(groupId, listId);
  if (!list) notFound();
  return <ShoppingListView list={list} />;
}

export default function SpesaListPage({
  params,
}: {
  params: { groupId: string; listId: string };
}) {
  return (
    <Suspense
      fallback={
        <Center h={200}>
          <Loader />
        </Center>
      }
    >
      <Content groupId={params.groupId} listId={params.listId} />
    </Suspense>
  );
}

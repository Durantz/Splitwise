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

export default async function SpesaListPage({
  params,
}: {
  params: Promise<{ groupId: string; listId: string }>;
}) {
  const { groupId, listId } = await params;
  return (
    <Suspense
      fallback={
        <Center h={200}>
          <Loader />
        </Center>
      }
    >
      <Content groupId={groupId} listId={listId} />
    </Suspense>
  );
}

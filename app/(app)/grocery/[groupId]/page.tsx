import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Center, Loader } from "@mantine/core";
import { getShoppingGroupDetail } from "./server";
import { ShoppingGroupView } from "./ShoppingGroupView";

export const dynamic = "force-dynamic";

async function Content({ groupId }: { groupId: string }) {
  const group = await getShoppingGroupDetail(groupId);
  if (!group) notFound();
  return <ShoppingGroupView group={group} />;
}

export default async function SpesaGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return (
    <Suspense
      fallback={
        <Center h={200}>
          <Loader />
        </Center>
      }
    >
      <Content groupId={groupId} />
    </Suspense>
  );
}

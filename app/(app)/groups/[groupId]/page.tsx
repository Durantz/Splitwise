import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getGroupById } from "@/app/(app)/groups/server";
import { getExpenses } from "@/app/(app)/expenses/server";
import { getDashboardData } from "@/app/(app)/dashboard/server";
import GroupDetailView from "@/components/groups/GroupDetailView";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default async function GroupDetailPage({ params }: Props) {
  const session = await requireSession();
  const { groupId } = await params;
  const [group, expenses, dashData] = await Promise.all([
    getGroupById(groupId, session.user.id),
    getExpenses(groupId),
    getDashboardData(groupId),
  ]);

  if (!group) notFound();

  return (
    <GroupDetailView
      group={group}
      expenses={expenses}
      dashData={dashData}
      currentUserId={session.user.id}
    />
  );
}

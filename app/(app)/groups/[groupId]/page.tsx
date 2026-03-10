import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getGroupById } from "@/app/(app)/groups/server";
import { getExpenses } from "@/app/(app)/expenses/server";
import { getDashboardData } from "@/app/(app)/dashboard/server";
import {
  getPairBalances,
  getGroupSettlements,
} from "@/app/(app)/settlements/server";
import { getRecurringExpenses } from "@/app/(app)/recurring/server";
import GroupDetailView from "@/components/groups/GroupDetailView";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default async function GroupDetailPage({ params }: Props) {
  const session = await requireSession();
  const { groupId } = await params;

  const [
    group,
    expenses,
    dashData,
    pairBalances,
    recurringExpenses,
    settlementHistory,
  ] = await Promise.all([
    getGroupById(groupId, session.user.id),
    getExpenses(groupId),
    getDashboardData(groupId),
    getPairBalances(groupId),
    getRecurringExpenses(groupId),
    getGroupSettlements(groupId),
  ]);

  if (!group) notFound();

  return (
    <GroupDetailView
      group={group}
      expenses={expenses}
      recurringExpenses={recurringExpenses}
      settlementHistory={settlementHistory}
      dashData={dashData}
      pairBalances={pairBalances}
      currentUserId={session.user.id}
    />
  );
}

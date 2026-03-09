import { requireSession } from "@/lib/session";
import { getUserGroups } from "@/app/(app)/groups/server";
import { getExpenses } from "./server";
import ExpensesView, { ExpensesEmpty } from "@/components/expenses/ExpensesView";

interface Props {
  searchParams: Promise<{ groupId?: string }>;
}

export default async function ExpensesPage({ searchParams }: Props) {
  const [session, { groupId }] = await Promise.all([
    requireSession(),
    searchParams,
  ]);
  const groups = await getUserGroups(session.user.id);

  if (groups.length === 0) {
    return <ExpensesEmpty />;
  }

  const activeGroupId = groupId ?? groups[0].id;
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];
  const expenses = await getExpenses(activeGroup.id);

  return (
    <ExpensesView
      groups={groups}
      activeGroup={activeGroup}
      expenses={expenses}
      currentUserId={session.user.id}
    />
  );
}

import { requireSession } from "@/lib/session";
import { getUserGroups } from "@/app/(app)/groups/server";
import { getDashboardData } from "./server";
import DashboardView, { DashboardEmpty } from "@/components/dashboard/DashboardView";

interface Props {
  searchParams: Promise<{ groupId?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const [session, { groupId }] = await Promise.all([
    requireSession(),
    searchParams,
  ]);
  const groups = await getUserGroups(session.user.id);

  if (groups.length === 0) {
    return <DashboardEmpty />;
  }

  const activeGroupId = groupId ?? groups[0].id;
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];
  const data = await getDashboardData(activeGroup.id);

  return (
    <DashboardView
      session={session}
      groups={groups}
      activeGroup={activeGroup}
      data={data}
    />
  );
}

import { requireSession } from "@/lib/session";
import { getUserGroups } from "./server";
import GroupsView from "@/components/groups/GroupsView";

export default async function GroupsPage() {
  const session = await requireSession();
  const groups = await getUserGroups(session.user.id);

  return <GroupsView groups={groups} currentUserId={session.user.id} />;
}

import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { listUserGroups, getGroupMembers } from '@/lib/db/store';
import GroupList from '@/components/groups/GroupList';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const groups = await listUserGroups(session.user.id);

  const groupsWithMembers = await Promise.all(
    groups.map(async (g) => ({
      ...g,
      members: await getGroupMembers(g.id),
    })),
  );

  return (
    <GroupList
      groups={groupsWithMembers}
      userId={session.user.id}
    />
  );
}

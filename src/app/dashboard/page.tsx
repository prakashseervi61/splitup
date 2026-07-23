import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { listUserGroups, getGroupMembers, findUserById } from '@/lib/db/store';
import DashboardClient from '@/components/groups/DashboardClient';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await findUserById(session.user.id);
  if (!user) redirect('/login');

  const groups = await listUserGroups(session.user.id);

  const groupsWithMembers = await Promise.all(
    groups.map(async (g) => ({
      ...g,
      members: await getGroupMembers(g.id),
    })),
  );

  return (
    <DashboardClient
      userId={session.user.id}
      userName={user.name}
      onboardingCompleted={user.onboarding_completed ?? false}
      groups={groupsWithMembers}
    />
  );
}

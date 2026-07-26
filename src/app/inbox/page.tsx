import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  findUserById,
  listInvitesForPhone,
  listInvitesByUser,
  getGroup,
  listUserGroups,
} from '@/lib/db/store';
import InboxActions from '@/components/groups/InboxActions';

export default async function InboxPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = session.user;

  const [receivedInvites, sentInvites, groups] = await Promise.all([
    listInvitesForPhone(user.phone),
    listInvitesByUser(user.id),
    listUserGroups(user.id),
  ]);

  const [enrichedReceived, enrichedSent] = await Promise.all([
    Promise.all(
      receivedInvites.map(async (invite) => {
        const [group, sender] = await Promise.all([
          getGroup(invite.group_id),
          findUserById(invite.from_user_id),
        ]);
        return {
          ...invite,
          group_name: group?.name ?? 'Unknown Group',
          from_user_name: sender?.name ?? 'Unknown',
        };
      }),
    ),
    Promise.all(
      sentInvites.map(async (invite) => {
        const group = await getGroup(invite.group_id);
        return {
          ...invite,
          group_name: group?.name ?? 'Unknown Group',
          from_user_name: user.name,
        };
      }),
    ),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 py-2 text-sm text-text-muted hover:text-text-body"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-text-heading">Inbox</h1>

      <InboxActions
        received={enrichedReceived}
        sent={enrichedSent}
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      />
    </div>
  );
}

import { NextRequest } from 'next/server';
import {
  createInvite,
  findUserByPhone,
  findUserById,
  listInvitesForPhone,
  listInvitesByUser,
  getGroup,
} from '@/lib/db/store';
import { getMockSessionUserId } from '@/lib/auth/mock-session';

export async function POST(request: NextRequest) {
  try {
    const userId = getMockSessionUserId(request);
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { group_id, to_phone } = await request.json();
    if (!group_id || !to_phone) {
      return Response.json({ error: 'group_id and to_phone are required' }, { status: 400 });
    }

    const toUser = await findUserByPhone(to_phone);
    const invite = await createInvite({
      group_id,
      from_user_id: userId,
      to_phone,
      to_user_id: toUser?.id,
    });

    return Response.json(invite, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send invite';
    const status = (err as Error & { status?: number }).status;
    if (status === 409) {
      return Response.json({ error: 'User already invited or already a member' }, { status: 409 });
    }
    if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already')) {
      return Response.json({ error: 'User already invited or already a member' }, { status: 409 });
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getMockSessionUserId(request);
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await findUserById(userId);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const type = request.nextUrl.searchParams.get('type') ?? 'received';

    let invites;
    if (type === 'sent') {
      invites = await listInvitesByUser(userId);
    } else {
      invites = await listInvitesForPhone(user.phone);
    }

    // Enrich with group names and sender names
    const enriched = await Promise.all(
      invites.map(async (invite) => {
        const group = await getGroup(invite.group_id);
        const sender = await findUserById(invite.from_user_id);
        return {
          ...invite,
          group_name: group?.name ?? 'Unknown Group',
          from_user_name: sender?.name ?? 'Unknown',
        };
      }),
    );

    return Response.json(enriched);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list invites';
    return Response.json({ error: msg }, { status: 500 });
  }
}

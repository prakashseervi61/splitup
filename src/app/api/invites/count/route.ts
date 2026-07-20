import { NextRequest } from 'next/server';
import { findUserById, listInvitesForPhone } from '@/lib/db/store';
import { getMockSessionUserId } from '@/lib/auth/mock-session';

export async function GET(request: NextRequest) {
  try {
    const userId = getMockSessionUserId(request);
    if (!userId) return Response.json({ count: 0 });

    const user = await findUserById(userId);
    if (!user) return Response.json({ count: 0 });

    const invites = await listInvitesForPhone(user.phone);
    const pendingCount = invites.filter((i) => i.status === 'pending').length;

    return Response.json({ count: pendingCount });
  } catch {
    return Response.json({ count: 0 });
  }
}

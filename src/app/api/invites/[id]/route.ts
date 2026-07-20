import { NextRequest } from 'next/server';
import { updateInviteStatus } from '@/lib/db/store';
import { getMockSessionUserId } from '@/lib/auth/mock-session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getMockSessionUserId(request);
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { action } = await request.json();

    if (action !== 'accept' && action !== 'reject') {
      return Response.json({ error: 'Action must be accept or reject' }, { status: 400 });
    }

    const status = action === 'accept' ? 'accepted' : 'rejected';
    const invite = await updateInviteStatus(id, status);

    if (!invite) {
      return Response.json({ error: 'Invite not found' }, { status: 404 });
    }

    return Response.json(invite);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update invite';
    return Response.json({ error: msg }, { status: 500 });
  }
}

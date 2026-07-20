import { NextRequest } from 'next/server';
import { addGroupMember, findUserByPhone } from '@/lib/db/store';
import { getMockSessionUserId } from '@/lib/auth/mock-session';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params;
    const userId = getMockSessionUserId(request);
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { phone } = await request.json();
    if (!phone) return Response.json({ error: 'Phone is required' }, { status: 400 });

    const user = await findUserByPhone(phone);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const member = await addGroupMember(groupId, user.id);
    return Response.json({ member: { user_id: member.user_id, user: { id: user.id, name: user.name, phone: user.phone } } }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to add member';
    if (msg.includes('duplicate') || msg.includes('already')) {
      return Response.json({ error: 'Member already in group' }, { status: 409 });
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}

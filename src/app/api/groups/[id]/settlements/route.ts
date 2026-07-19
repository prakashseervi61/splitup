import { NextRequest } from 'next/server';
import {
  getGroup,
  getGroupMembers,
  createSettlement,
  getGroupSettlements,
} from '@/lib/db/store';

// ---------------------------------------------------------------------------
// POST /api/groups/[id]/settlements  —  create a settlement
// ---------------------------------------------------------------------------
// Body: { from_user, to_user, amount, note? }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: groupId } = await params;

    const group = getGroup(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const { from_user, to_user, amount, note } = body;

    if (!from_user || !to_user || amount == null) {
      return Response.json(
        { error: 'from_user, to_user, and amount are required' },
        { status: 400 },
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return Response.json(
        { error: 'amount must be a positive number' },
        { status: 400 },
      );
    }

    if (from_user === to_user) {
      return Response.json(
        { error: 'Cannot settle with yourself' },
        { status: 400 },
      );
    }

    // Verify both users are members
    const members = getGroupMembers(groupId);
    const memberIds = new Set(members.map((m) => m.user_id));
    if (!memberIds.has(from_user)) {
      return Response.json(
        { error: 'from_user is not a group member' },
        { status: 400 },
      );
    }
    if (!memberIds.has(to_user)) {
      return Response.json(
        { error: 'to_user is not a group member' },
        { status: 400 },
      );
    }

    const settlement = createSettlement({
      group_id: groupId,
      from_user,
      to_user,
      amount,
      note,
    });

    return Response.json(settlement, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: 'Failed to create settlement', details: String(err) },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/groups/[id]/settlements  —  list settlements
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: groupId } = await params;

    const group = getGroup(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const settlements = getGroupSettlements(groupId);
    return Response.json(settlements);
  } catch (err) {
    return Response.json(
      { error: 'Failed to list settlements', details: String(err) },
      { status: 500 },
    );
  }
}

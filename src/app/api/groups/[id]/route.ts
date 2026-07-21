import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getGroup,
  getGroupMembers,
  computeBalances,
  updateGroup,
  deleteGroup,
  getGroupExpenses,
  getGroupSettlements,
} from '@/lib/db/store';

// ---------------------------------------------------------------------------
// GET /api/groups/[id]  —  get group details with members and balances
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const group = await getGroup(id);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const [members, balances] = await Promise.all([
      getGroupMembers(id),
      computeBalances(id),
    ]);

    return Response.json(
      { ...group, members, balances },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
    );
  } catch (err) {
    return Response.json(
      { error: 'Failed to get group', details: String(err) },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/groups/[id]  —  rename group (creator only)
// ---------------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const group = await getGroup(id);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.created_by !== session.user.id) {
      return Response.json(
        { error: 'Only the group creator can rename this group' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name } = body;

    if (typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ error: 'Group name cannot be empty' }, { status: 400 });
    }
    if (name.trim().length > 50) {
      return Response.json(
        { error: 'Group name must be 50 characters or less' },
        { status: 400 },
      );
    }

    const updated = await updateGroup(id, { name: name.trim() });
    if (!updated) {
      return Response.json({ error: 'Failed to update group' }, { status: 500 });
    }

    return Response.json(updated);
  } catch (err) {
    return Response.json(
      { error: 'Failed to rename group', details: String(err) },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/groups/[id]  —  delete group (creator only)
// ---------------------------------------------------------------------------
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const group = await getGroup(id);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.created_by !== session.user.id) {
      return Response.json(
        { error: 'Only the group creator can delete this group' },
        { status: 403 },
      );
    }

    const expenses = await getGroupExpenses(id);
    const settlements = await getGroupSettlements(id);

    const hasPendingSettlements = settlements.some(
      (s) => s.status === 'pending',
    );
    const hasUnsettledActivity =
      expenses.length > 0 && (settlements.length === 0 || hasPendingSettlements);

    if (hasUnsettledActivity) {
      return Response.json(
        { error: 'Settle all balances before deleting the group' },
        { status: 409 },
      );
    }

    await deleteGroup(id);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: 'Failed to delete group', details: String(err) },
      { status: 500 },
    );
  }
}

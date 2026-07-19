import { NextRequest } from 'next/server';
import {
  getGroup,
  getGroupMembers,
  computeBalances,
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

    const members = await getGroupMembers(id);
    const balances = await computeBalances(id);

    return Response.json({
      ...group,
      members,
      balances,
    });
  } catch (err) {
    return Response.json(
      { error: 'Failed to get group', details: String(err) },
      { status: 500 },
    );
  }
}

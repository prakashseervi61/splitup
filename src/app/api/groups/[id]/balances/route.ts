import { NextRequest } from 'next/server';
import {
  getGroup,
  computeBalances,
} from '@/lib/db/store';
import { simplifyDebts } from '@/lib/utils/split';

// ---------------------------------------------------------------------------
// GET /api/groups/[id]/balances  —  compute net balances
// Query params: ?simplified=true  — returns simplified settlement plan
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: groupId } = await params;

    const group = getGroup(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const balances = computeBalances(groupId);
    const simplified = request.nextUrl.searchParams.get('simplified') === 'true';

    if (simplified) {
      const plan = simplifyDebts(balances);
      return Response.json({ balances, simplified: plan });
    }

    return Response.json({ balances });
  } catch (err) {
    return Response.json(
      { error: 'Failed to compute balances', details: String(err) },
      { status: 500 },
    );
  }
}

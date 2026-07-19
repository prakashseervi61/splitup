import { NextRequest } from 'next/server';
import {
  getGroup,
  updateSettlementStatus,
  getGroupSettlements,
} from '@/lib/db/store';

// ---------------------------------------------------------------------------
// PATCH /api/groups/[id]/settlements/[settlementId]
// ---------------------------------------------------------------------------
// Body: { status: 'confirmed' | 'disputed' }
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; settlementId: string }> },
) {
  try {
    const { id: groupId, settlementId } = await params;

    const group = getGroup(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await _request.json();
    const { status } = body;

    if (!status || !['confirmed', 'disputed'].includes(status)) {
      return Response.json(
        { error: 'status must be "confirmed" or "disputed"' },
        { status: 400 },
      );
    }

    // Verify settlement belongs to this group
    const settlements = getGroupSettlements(groupId);
    const settlement = settlements.find((s) => s.id === settlementId);
    if (!settlement) {
      return Response.json(
        { error: 'Settlement not found in this group' },
        { status: 404 },
      );
    }

    const updated = updateSettlementStatus(settlementId, status);
    return Response.json(updated);
  } catch (err) {
    return Response.json(
      { error: 'Failed to update settlement', details: String(err) },
      { status: 500 },
    );
  }
}

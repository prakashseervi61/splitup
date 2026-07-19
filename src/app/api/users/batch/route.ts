import { NextRequest } from 'next/server';
import { findUsersByIds } from '@/lib/db/store';

// ---------------------------------------------------------------------------
// GET /api/users/batch?ids=id1,id2,id3  —  return map of id → {id, name, phone}
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    if (!idsParam) {
      return Response.json({ error: 'ids query parameter is required' }, { status: 400 });
    }

    const ids = idsParam.split(',').filter(Boolean);
    if (ids.length === 0) return Response.json({});

    const users = await findUsersByIds(ids);
    const map: Record<string, { id: string; name: string; phone: string; default_vpa: string }> = {};
    for (const u of users) {
      map[u.id] = { id: u.id, name: u.name, phone: u.phone, default_vpa: u.default_vpa ?? '' };
    }

    return Response.json(map);
  } catch (err) {
    return Response.json(
      { error: 'Failed to fetch users', details: String(err) },
      { status: 500 },
    );
  }
}

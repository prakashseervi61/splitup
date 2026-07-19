import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

// ---------------------------------------------------------------------------
// GET /api/auth/me  —  return current user from session (401 if unauthenticated)
// ---------------------------------------------------------------------------
export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return Response.json({ user: session.user });
}

import { NextRequest } from 'next/server';
import { getMockSessionUserId } from '@/lib/auth/mock-session';
import { findUserById } from '@/lib/db/store';

// ---------------------------------------------------------------------------
// GET /api/auth/me  —  return current user (or 401)
// DEV MODE: Reads from mock session cookie.
// TODO: When real OTP is wired, use createServerSupabase() and
//       supabase.auth.getUser() instead of getMockSessionUserId.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const userId = getMockSessionUserId(request);
    if (!userId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await findUserById(userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(user);
  } catch {
    return Response.json({ error: 'Failed to get user' }, { status: 500 });
  }
}

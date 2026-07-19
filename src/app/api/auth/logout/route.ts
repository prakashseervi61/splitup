import { NextRequest, NextResponse } from 'next/server';
import { clearMockSessionCookie } from '@/lib/auth/mock-session';

// ---------------------------------------------------------------------------
// POST /api/auth/logout  —  clear session
// DEV MODE: Clears the mock session cookie.
// TODO: When real OTP is wired, use createServerSupabase() and
//       supabase.auth.signOut() to clear the Supabase Auth session.
// ---------------------------------------------------------------------------
export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    clearMockSessionCookie(
      (cookie) => response.cookies.set(cookie.name, cookie.value, cookie),
    );
    return response;
  } catch {
    return Response.json({ error: 'Failed to logout' }, { status: 500 });
  }
}

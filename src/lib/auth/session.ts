import { findUserById } from '@/lib/db/store';
import { getMockSessionUserIdServer } from '@/lib/auth/mock-session';
import type { User } from '@/types';

// ---------------------------------------------------------------------------
// Session helpers — reads current user from the mock session cookie.
// Used by the layout to show the correct nav state.
//
// DEV MODE: Uses mock session cookie. See mock-session.ts for swap docs.
// TODO: When real OTP is wired, use createServerSupabase() and
//       supabase.auth.getUser() instead.
// ---------------------------------------------------------------------------

export async function getSession(): Promise<{ user: User } | null> {
  try {
    const userId = await getMockSessionUserIdServer();
    if (!userId) return null;

    const user = await findUserById(userId);
    return user ? { user } : null;
  } catch {
    return null;
  }
}

/**
 * Set a session for a user — no-op in dev mode.
 * Sessions are managed by the mock cookie set in verify-otp.
 */
export async function setSession(_user: User): Promise<void> {
  // Sessions are managed entirely by the mock session cookie via verify-otp.
  // This is a no-op.
}

export async function clearSession(): Promise<void> {
  // Cleared by the /api/auth/logout route which calls clearMockSessionCookie.
}

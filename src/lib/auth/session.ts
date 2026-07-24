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



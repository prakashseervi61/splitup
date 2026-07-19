import { createServerSupabase } from '@/lib/supabase/server';
import { findUserById } from '@/lib/db/store';
import type { User } from '@/types';

// ---------------------------------------------------------------------------
// Session helpers backed by Supabase Auth
// ---------------------------------------------------------------------------

export async function getSession(): Promise<{ user: User } | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const user = await findUserById(authUser.id);
    return user ? { user } : null;
  } catch {
    return null;
  }
}

/**
 * Set a session for a user by creating a Supabase Auth session.
 * Used for backward compatibility — the verify-otp route now handles
 * this via Supabase Auth directly, but this helper is kept for any
 * code that still calls setSession directly.
 */
export async function setSession(_user: User): Promise<void> {
  // Sessions are managed entirely by Supabase Auth via the verify-otp flow.
  // This is a no-op — the Supabase SSR cookie is already set by the auth
  // response. The function is kept for API compatibility.
}

export async function clearSession(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
}

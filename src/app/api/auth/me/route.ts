import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { findUserById } from '@/lib/db/store';

// ---------------------------------------------------------------------------
// GET /api/auth/me  —  return current user from Supabase Auth session
// ---------------------------------------------------------------------------
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Look up user in our DB by the Auth user ID
    const user = await findUserById(authUser.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ user });
  } catch {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
}

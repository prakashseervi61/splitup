import { createServerSupabase } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// POST /api/auth/logout  —  sign out via Supabase Auth
// ---------------------------------------------------------------------------
export async function POST() {
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Failed to sign out' }, { status: 500 });
  }
}

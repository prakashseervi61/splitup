import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// POST /api/auth/send-otp  —  send SMS OTP via Supabase Auth
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return Response.json(
        { error: 'Phone number is required' },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithOtp({ phone });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true, message: 'OTP sent successfully' });
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

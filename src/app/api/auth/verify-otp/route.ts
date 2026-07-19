import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { findUserByPhone, createUser } from '@/lib/db/store';

// ---------------------------------------------------------------------------
// POST /api/auth/verify-otp  —  verify OTP via Supabase Auth
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return Response.json(
        { error: 'Phone and OTP are required' },
        { status: 400 },
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return Response.json(
        { error: 'OTP must be a 6-digit number' },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    const authUser = data.user;
    if (!authUser) {
      return Response.json(
        { error: 'Authentication failed' },
        { status: 401 },
      );
    }

    // Find existing user by phone, or create one linked to the Auth user's ID
    let user = await findUserByPhone(phone);
    if (!user) {
      user = await createUser({
        id: authUser.id,
        phone,
        name: `User ${phone.slice(-4)}`,
      });
    }

    return Response.json({ user });
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

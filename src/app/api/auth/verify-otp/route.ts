import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { findUserByPhone, createUser } from '@/lib/db/store';
import { setMockSessionCookie } from '@/lib/auth/mock-session';

// ---------------------------------------------------------------------------
// POST /api/auth/verify-otp  —  verify OTP and create session
//
// DEV MODE: Accepts any 6-digit code, finds or creates the user in the
// database, and sets a mock session cookie. No Supabase Auth involved.
//
// TODO: When real phone OTP is wired:
//   1. Import createServerSupabase from '@/lib/supabase/server'
//   2. Call supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
//   3. Remove the setMockSessionCookie call — supabase handles the session
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

    // Rate limit: 5 verification attempts per phone per 60s
    const rl = checkRateLimit(`verify:${phone}`, 5, 60_000);
    if (!rl.allowed) {
      return Response.json(
        { error: 'Too many attempts. Please request a new OTP.' },
        { status: 429 },
      );
    }

    // DEV MODE: Accept any 6-digit OTP.
    // TODO: When real OTP is wired, replace the block below with:
    //   const supabase = await createServerSupabase();
    //   const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    //   if (error) return Response.json({ error: error.message }, { status: 401 });
    //   const authUser = data.user;
    //   if (!authUser) return Response.json({ error: 'Authentication failed' }, { status: 401 });
    //
    // What you need in Supabase Dashboard:
    //   1. Authentication → Providers → Phone → toggle ON
    //   2. SMS provider credentials (Twilio / MSG91)

    // Find existing user by phone, or create one
    let user = await findUserByPhone(phone);
    if (!user) {
      user = await createUser({
        phone,
        name: `User ${phone.slice(-4)}`,
        default_vpa: '',
      });
    }

    // Set mock session cookie
    const response = NextResponse.json({ user });
    setMockSessionCookie(
      (cookie) => response.cookies.set(cookie.name, cookie.value, cookie),
      user.id,
    );

    return response;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { findUserByPhone } from '@/lib/db/store';

// ---------------------------------------------------------------------------
// POST /api/auth/send-otp  —  send SMS OTP via Supabase Auth
//
// DEV MODE: Always succeeds (no SMS sent). The OTP can be any 6-digit code.
// TODO: When real phone OTP is wired, uncomment the supabase.auth.signInWithOtp
//       call below and remove the early-return.
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

    // Rate limit: 3 OTP requests per phone number per 60s
    const rl = checkRateLimit(`otp:${phone}`, 3, 60_000);
    if (!rl.allowed) {
      return Response.json(
        { error: 'Too many OTP requests. Please wait before trying again.' },
        { status: 429 },
      );
    }

    // DEV MODE: Skip real Supabase Auth OTP send.
    // TODO: Uncomment the lines below when Phone provider is enabled.
    // const supabase = await createServerSupabase();
    // const { error } = await supabase.auth.signInWithOtp({ phone });
    // if (error) return Response.json({ error: error.message }, { status: 400 });

    // What you need in Supabase Dashboard:
    //   1. Authentication → Providers → Phone → toggle ON
    //   2. Configure an SMS provider (Twilio / MSG91) with credentials
    //   3. Then uncomment the supabase call above

    const existingUser = await findUserByPhone(phone);

    return Response.json({
      success: true,
      message: 'OTP sent successfully',
      exists: existingUser !== null,
    });
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

import { NextRequest } from 'next/server';
import { findUserByPhone, createUser } from '@/lib/db/store';
import { setSession } from '@/lib/auth/session';

// ---------------------------------------------------------------------------
// STUB: POST /api/auth/verify-otp
//
// Accepts any 6-digit OTP. Creates a user if they don't exist, sets a
// session cookie, and returns the user object.
// Replace with real OTP verification before production.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return Response.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    if (!/^\d{6}$/.test(otp)) {
      return Response.json({ error: 'OTP must be a 6-digit number' }, { status: 400 });
    }

    // Find existing user or create a new one
    let user = findUserByPhone(phone);
    if (!user) {
      user = createUser({
        phone,
        name: `User ${phone.slice(-4)}`,
      });
    }

    await setSession(user);

    return Response.json({ user });
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { findUserByPhone, createUser } from '@/lib/db/store';
import { setMockSessionCookie } from '@/lib/auth/mock-session';
import { getPendingPhone } from '@/app/api/auth/verify-otp/route';

// ---------------------------------------------------------------------------
// POST /api/auth/create-profile  —  create a user after phone verification
//
// Called by the client after verify-otp returns { isNew: true } and the user
// provides their name.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json();

    if (!phone || !name || !name.trim()) {
      return Response.json(
        { error: 'Phone and name are required' },
        { status: 400 },
      );
    }

    // Check that this phone was recently verified via OTP
    if (!getPendingPhone(phone)) {
      return Response.json(
        { error: 'Phone not verified, please request OTP again' },
        { status: 401 },
      );
    }

    // Race condition guard: ensure user doesn't already exist
    const existingUser = await findUserByPhone(phone);
    if (existingUser) {
      // Already exists — just log them in
      const response = NextResponse.json({ user: existingUser });
      setMockSessionCookie(
        (cookie) => response.cookies.set(cookie.name, cookie.value, cookie),
        existingUser.id,
      );
      return response;
    }

    // Create the new user
    const user = await createUser({
      phone,
      name: name.trim(),
      default_vpa: '',
    });

    // Set session cookie
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

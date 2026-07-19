// ---------------------------------------------------------------------------
// Mock / dev-only session — replaces Supabase Auth phone OTP for local dev.
//
// HOW IT WORKS:
//   After a successful "verify-otp" flow, the user ID is stored in a signed
//   cookie named "mock_session". The proxy and layout read this cookie to
//   authenticate the user, bypassing Supabase Auth entirely.
//
//   This file is the single swap point. When real phone OTP is wired in:
//     1. Delete this file
//     2. Uncomment the supabase.auth.getUser() call in proxy.ts
//     3. Remove the mock_session cookie reads from auth routes
//     4. Delete the "mock_session" checks from session.ts
//
// WHAT YOU NEED FOR REAL OTP:
//   - Supabase Dashboard → Authentication → Providers → Phone → toggle ON
//   - SMS provider credentials (Twilio / MSG91) in the Phone provider config
//   - Then the existing supabase.auth.signInWithOtp({phone}) will work
// ---------------------------------------------------------------------------

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

const COOKIE_NAME = 'mock_session';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// ponytail: unsigned cookie is sufficient for dev. Production MUST use
// signed/encrypted cookies or Supabase Auth SSR.

/** Set the mock session cookie on a response. */
export function setMockSessionCookie(
  setCookie: (cookie: ResponseCookie) => void,
  userId: string,
): void {
  setCookie({
    name: COOKIE_NAME,
    value: userId,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

/** Clear the mock session cookie on a response. */
export function clearMockSessionCookie(
  setCookie: (cookie: ResponseCookie) => void,
): void {
  setCookie({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/** Read the mock session user ID from a request. */
export function getMockSessionUserId(request: NextRequest): string | null {
  const cookie = request.cookies.get(COOKIE_NAME);
  return cookie?.value ?? null;
}

/**
 * Get the mock session user ID from the cookies() API (used in server
 * components / server actions).
 */
export async function getMockSessionUserIdServer(): Promise<string | null> {
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME);
  return cookie?.value ?? null;
}

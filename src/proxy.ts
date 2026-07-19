import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMockSessionUserId } from '@/lib/auth/mock-session';

// ---------------------------------------------------------------------------
// Auth proxy — runs before every matching request.
// Redirects unauthenticated users to /login.
//
// DEV MODE: Uses a mock session cookie instead of Supabase Auth phone OTP.
//   The mock session is set by the /api/auth/verify-otp route after accepting
//   any 6-digit code. This is temporary — see mock-session.ts for swap docs.
//
// Public routes (no auth check):
//   - /_next/*         (Next.js internals)
//   - /api/auth/*      (auth API — login, signup, etc.)
//   - /login           (login page)
//   - /favicon.ico     (browser icon)
//   - /manifest.json   (PWA manifest)
//
// TODO: When real OTP is wired, uncomment the supabase.auth.getUser() call
//       below and remove the mock_session check. This is the ONLY place the
//       proxy needs to change.
//
// Next.js 16 note: middleware.ts is deprecated, this file uses the new
// proxy.ts convention. See node_modules/next/dist/docs/ for details.
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and assets through without auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // DEV MODE: Check mock session cookie first.
  // TODO: Replace with supabase.auth.getUser() for real OTP auth.
  const mockUserId = getMockSessionUserId(request);
  if (mockUserId) {
    return NextResponse.next();
  }

  // API routes return JSON 401 instead of HTML redirect so client fetch() works
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 },
    );
  }
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // ponytail: broad matcher — proxy runs on all routes except static assets.
    // Static files (images, fonts) bypass the proxy entirely for performance.
    '/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$).*)',
  ],
};

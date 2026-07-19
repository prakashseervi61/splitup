import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Auth proxy — runs before every matching request.
// Redirects unauthenticated users to /login.
//
// Public routes (no auth check):
//   - /_next/*         (Next.js internals)
//   - /api/auth/*      (auth API — login, signup, etc.)
//   - /login           (login page)
//   - /favicon.ico     (browser icon)
//   - /manifest.json   (PWA manifest)
//
// Next.js 16 note: middleware.ts is deprecated, this file uses the new
// proxy.ts convention. See node_modules/next/dist/docs/ for details.
// ---------------------------------------------------------------------------

export function proxy(request: NextRequest) {
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

  // Check for session cookie
  const session = request.cookies.get('splitup_session');
  if (!session?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // ponytail: broad matcher — proxy runs on all routes except static assets.
    // Static files (images, fonts) bypass the proxy entirely for performance.
    '/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$).*)',
  ],
};

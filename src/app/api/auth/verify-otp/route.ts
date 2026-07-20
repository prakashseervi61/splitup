import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { findUserByPhone } from '@/lib/db/store';
import { setMockSessionCookie } from '@/lib/auth/mock-session';

// ---------------------------------------------------------------------------
// In-memory store for pending phone verifications (new users only).
// Key: "pending_phone:{phone}", Value: { createdAt: number }
// Expires after 5 minutes.
// ---------------------------------------------------------------------------
const pendingPhones = new Map<string, { createdAt: number }>();
const PENDING_PHONE_TTL = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of pendingPhones) {
    if (entry.createdAt + PENDING_PHONE_TTL <= now) pendingPhones.delete(key);
  }
}, 60_000);

export function getPendingPhone(phone: string): boolean {
  const entry = pendingPhones.get(`pending_phone:${phone}`);
  if (!entry) return false;
  if (Date.now() - entry.createdAt > PENDING_PHONE_TTL) {
    pendingPhones.delete(`pending_phone:${phone}`);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// POST /api/auth/verify-otp  —  verify OTP and create session
//
// DEV MODE: Accepts any 6-digit code.
//   - Existing user → sets session cookie, returns { user, isNew: false }
//   - New phone     → stores pending verification, returns { isNew: true }
//                     (client then calls /create-profile with the name)
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

    // Find existing user
    const existingUser = await findUserByPhone(phone);

    if (existingUser) {
      // Existing user — log in directly
      const response = NextResponse.json({ user: existingUser, isNew: false });
      setMockSessionCookie(
        (cookie) => response.cookies.set(cookie.name, cookie.value, cookie),
        existingUser.id,
      );
      return response;
    }

    // New phone — store pending verification, do NOT create user yet
    pendingPhones.set(`pending_phone:${phone}`, { createdAt: Date.now() });

    return NextResponse.json({ isNew: true });
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

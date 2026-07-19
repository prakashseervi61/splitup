import { clearSession } from '@/lib/auth/session';

// ---------------------------------------------------------------------------
// POST /api/auth/logout  —  clear session cookie
// ---------------------------------------------------------------------------
export async function POST() {
  await clearSession();
  return Response.json({ success: true });
}

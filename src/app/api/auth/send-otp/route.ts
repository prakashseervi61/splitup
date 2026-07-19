import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// STUB: POST /api/auth/send-otp
//
// Accepts any phone number and always returns success.
// Replace with real SMS provider (Twilio, MSG91, etc.) before production.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return Response.json({ error: 'Phone number is required' }, { status: 400 });
    }

    return Response.json({ success: true, message: 'OTP sent successfully' });
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

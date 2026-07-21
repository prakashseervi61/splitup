import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { findUserById, updateUserProfile } from '@/lib/db/store';
import { getMockSessionUserId } from '@/lib/auth/mock-session';

// GET /api/profile — get current user profile
export async function GET(request: NextRequest) {
  try {
    const userId = getMockSessionUserId(request);
    if (!userId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const user = await findUserById(userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    return Response.json(user, {
      headers: { 'Cache-Control': 'private, s-maxage=60' },
    });
  } catch (err) {
    return Response.json(
      { error: 'Failed to get profile', details: String(err) },
      { status: 500 },
    );
  }
}

// PATCH /api/profile — update name or default_vpa
export async function PATCH(request: NextRequest) {
  try {
    const userId = getMockSessionUserId(request);
    if (!userId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, default_vpa } = body;

    const updates: { name?: string; default_vpa?: string } = {};
    if (name !== undefined) updates.name = name;
    if (default_vpa !== undefined && typeof default_vpa === 'string') {
      // Validate VPA format
      if (default_vpa && !/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(default_vpa)) {
        return Response.json({ error: 'Invalid VPA format' }, { status: 400 });
      }
      updates.default_vpa = default_vpa;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    const user = await updateUserProfile(userId, updates);

    revalidatePath('/profile');

    return Response.json(user);
  } catch (err) {
    return Response.json(
      { error: 'Failed to update profile', details: String(err) },
      { status: 500 },
    );
  }
}

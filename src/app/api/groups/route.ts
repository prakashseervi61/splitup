import { NextRequest } from 'next/server';
import {
  createGroup,
  addGroupMember,
  getGroupMembers,
  listUserGroups,
  createUser,
  findUserByPhone,
  findUserById,
} from '@/lib/db/store';
import { checkRateLimit } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// POST /api/groups  —  create a new group
// ---------------------------------------------------------------------------
// Body: { name, type, created_by, members?: string[] }
//   members    optional array of user IDs to add (creator is added automatically)
//   newMembers optional array of { phone, name } to create+add on the fly
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 groups per user per hour
    const body = await request.json();
    const { name, type, created_by, members, newMembers } = body;
    if (created_by) {
      const rl = checkRateLimit(`group:create:${created_by}`, 5, 3600_000);
      if (!rl.allowed) {
        return Response.json(
          { error: 'Too many groups created. Please try again later.' },
          { status: 429 },
        );
      }
    }

    if (!name || !type || !created_by) {
      return Response.json(
        { error: 'name, type, and created_by are required' },
        { status: 400 },
      );
    }

    if (!['pg', 'hostel', 'trip'].includes(type)) {
      return Response.json(
        { error: 'type must be one of: pg, hostel, trip' },
        { status: 400 },
      );
    }

    const creator = await findUserById(created_by);
    if (!creator) {
      return Response.json(
        { error: 'created_by user not found' },
        { status: 404 },
      );
    }

    const group = await createGroup({ name, type, created_by });

    // Add creator
    await addGroupMember(group.id, created_by);

    // Add existing members by ID
    if (Array.isArray(members)) {
      for (const userId of members) {
        if (userId !== created_by) {
          await addGroupMember(group.id, userId);
        }
      }
    }

    // Create and add new members by phone
    if (Array.isArray(newMembers)) {
      for (const nm of newMembers) {
        let user = nm.phone ? await findUserByPhone(nm.phone) : null;
        if (!user && nm.name && nm.phone) {
          user = await createUser({ phone: nm.phone, name: nm.name });
        }
        if (user && user.id !== created_by) {
          await addGroupMember(group.id, user.id);
        }
      }
    }

    return Response.json(
      { ...group, members: await getGroupMembers(group.id) },
      { status: 201 },
    );
  } catch (err) {
    return Response.json(
      { error: 'Failed to create group', details: String(err) },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/groups?userId=xxx  —  list user's groups
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json(
        { error: 'userId query parameter is required' },
        { status: 400 },
      );
    }

    const groups = await listUserGroups(userId);

    // Attach member info to each group
    const result = await Promise.all(
      groups.map(async (g) => ({
        ...g,
        members: await getGroupMembers(g.id),
      })),
    );

    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: 'Failed to list groups', details: String(err) },
      { status: 500 },
    );
  }
}

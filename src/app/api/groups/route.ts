import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  createGroup,
  addGroupMembersBatch,
  getGroupMembersBatch,
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

    // Collect all member IDs to add in a single batch
    const memberIds: string[] = [created_by];

    if (Array.isArray(members)) {
      for (const userId of members) {
        if (userId !== created_by && !memberIds.includes(userId)) {
          memberIds.push(userId);
        }
      }
    }

    if (Array.isArray(newMembers)) {
      // Resolve new members in parallel
      const resolved = await Promise.all(
        newMembers.map(async (nm: { phone?: string; name?: string }) => {
          let user = nm.phone ? await findUserByPhone(nm.phone) : null;
          if (!user && nm.name && nm.phone) {
            user = await createUser({ phone: nm.phone, name: nm.name });
          }
          return user;
        }),
      );
      for (const user of resolved) {
        if (user && user.id !== created_by && !memberIds.includes(user.id)) {
          memberIds.push(user.id);
        }
      }
    }

    // Single batch insert for all members
    await addGroupMembersBatch(group.id, memberIds);

    const membersResult = await getGroupMembersBatch([group.id]);

    revalidatePath('/dashboard');

    return Response.json(
      { ...group, members: membersResult },
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
    if (groups.length === 0) {
      return Response.json([], {
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
      });
    }

    // Batch fetch all members in one query
    const groupIds = groups.map((g) => g.id);
    const allMembers = await getGroupMembersBatch(groupIds);

    // Group members by group_id for attachment
    const membersByGroup = new Map<string, typeof allMembers>();
    for (const m of allMembers) {
      const list = membersByGroup.get(m.group_id) ?? [];
      list.push(m);
      membersByGroup.set(m.group_id, list);
    }

    const result = groups.map((g) => ({
      ...g,
      members: membersByGroup.get(g.id) ?? [],
    }));

    return Response.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    return Response.json(
      { error: 'Failed to list groups', details: String(err) },
      { status: 500 },
    );
  }
}

import { NextRequest } from 'next/server';
import {
  getGroup,
  listRecurringTemplates,
  createRecurringTemplate,
} from '@/lib/db/store';

// GET /api/groups/[id]/recurring — list templates
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: groupId } = await params;
    const group = await getGroup(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }
    const templates = await listRecurringTemplates(groupId);
    return Response.json(templates);
  } catch (err) {
    return Response.json(
      { error: 'Failed to list templates', details: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/groups/[id]/recurring — create template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: groupId } = await params;
    const group = await getGroup(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const { created_by, description, amount, category, split_type, split_data, day_of_month } = body;

    if (!created_by || !description || amount == null || !split_type) {
      return Response.json(
        { error: 'created_by, description, amount, and split_type are required' },
        { status: 400 },
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return Response.json(
        { error: 'amount must be a positive number' },
        { status: 400 },
      );
    }

    if (!['equal', 'custom', 'percentage'].includes(split_type)) {
      return Response.json(
        { error: 'split_type must be equal, custom, or percentage' },
        { status: 400 },
      );
    }

    const template = await createRecurringTemplate({
      group_id: groupId,
      created_by,
      description,
      amount,
      category,
      split_type,
      split_data,
      day_of_month,
    });

    return Response.json(template, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: 'Failed to create template', details: String(err) },
      { status: 500 },
    );
  }
}

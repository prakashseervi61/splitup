import { NextRequest } from 'next/server';
import {
  updateRecurringTemplate,
  deleteRecurringTemplate,
  getGroupMembers,
  createExpense,
  createExpenseSplit,
} from '@/lib/db/store';
import {
  equalSplit,
  customSplit,
  percentageSplit,
} from '@/lib/utils/split';

// PATCH /api/groups/[id]/recurring/[templateId] — update template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> },
) {
  try {
    const { templateId } = await params;
    const body = await request.json();
    const template = await updateRecurringTemplate(templateId, body);
    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }
    return Response.json(template);
  } catch (err) {
    return Response.json(
      { error: 'Failed to update template', details: String(err) },
      { status: 500 },
    );
  }
}

// DELETE /api/groups/[id]/recurring/[templateId] — delete template
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> },
) {
  try {
    const { templateId } = await params;
    await deleteRecurringTemplate(templateId);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: 'Failed to delete template', details: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/groups/[id]/recurring/[templateId]/trigger — create expense from template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> },
) {
  try {
    const { id: groupId, templateId } = await params;
    const body = await request.json();

    // Get template from list and find the matching one
    const { listRecurringTemplates } = await import('@/lib/db/store');
    const templates = await listRecurringTemplates(groupId);
    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const { paid_by } = body;
    if (!paid_by) {
      return Response.json({ error: 'paid_by is required' }, { status: 400 });
    }

    const members = await getGroupMembers(groupId);
    const memberIds = members.map((m) => m.user_id);

    // Generate splits
    let splits;
    switch (template.split_type) {
      case 'equal': {
        splits = equalSplit('', template.amount, memberIds);
        break;
      }
      case 'custom': {
        splits = customSplit('', template.split_data);
        break;
      }
      case 'percentage': {
        splits = percentageSplit('', template.amount, template.split_data);
        break;
      }
      default:
        return Response.json(
          { error: `Invalid split_type: ${template.split_type}` },
          { status: 400 },
        );
    }

    const expense = await createExpense({
      group_id: groupId,
      paid_by,
      amount: template.amount,
      description: template.description,
      category: template.category,
      is_recurring: true,
    });

    for (const split of splits) {
      await createExpenseSplit({ ...split, expense_id: expense.id });
    }

    return Response.json(
      { ...expense, splits: splits.map((s) => ({ ...s, expense_id: expense.id })) },
      { status: 201 },
    );
  } catch (err) {
    return Response.json(
      { error: 'Failed to trigger expense', details: String(err) },
      { status: 500 },
    );
  }
}

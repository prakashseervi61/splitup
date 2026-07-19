import { NextRequest } from 'next/server';
import {
  getGroup,
  getGroupMembers,
  createExpense,
  createExpenseSplit,
  getGroupExpenses,
  getExpenseSplits,
} from '@/lib/db/store';
import {
  equalSplit,
  customSplit,
  percentageSplit,
} from '@/lib/utils/split';

// ---------------------------------------------------------------------------
// POST /api/groups/[id]/expenses  —  add an expense
// ---------------------------------------------------------------------------
// Body:
//   { paid_by, amount, description, category, split_method, split_data }
//
// split_method: 'equal' | 'custom' | 'percentage'
// split_data varies:
//   equal      → (none needed, splits among all group members)
//   custom     → { "user_id": share_amount, ... }
//   percentage → { "user_id": pct, ... }
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
    const {
      paid_by,
      amount,
      description,
      category,
      split_method,
      split_data,
      is_recurring,
      recurring_frequency,
    } = body;

    // -- validate required fields --
    if (!paid_by || amount == null || !split_method) {
      return Response.json(
        { error: 'paid_by, amount, and split_method are required' },
        { status: 400 },
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return Response.json(
        { error: 'amount must be a positive number' },
        { status: 400 },
      );
    }

    if (!['equal', 'custom', 'percentage'].includes(split_method)) {
      return Response.json(
        {
          error:
            'split_method must be one of: equal, custom, percentage',
        },
        { status: 400 },
      );
    }

    const members = await getGroupMembers(groupId);
    const memberIds = members.map((m) => m.user_id);

    // -- generate splits --
    let splits;
    switch (split_method) {
      case 'equal': {
        splits = equalSplit('', amount, memberIds);
        break;
      }
      case 'custom': {
        if (!split_data || typeof split_data !== 'object') {
          return Response.json(
            { error: 'split_data object is required for custom split' },
            { status: 400 },
          );
        }
        try {
          splits = customSplit('', split_data);
        } catch (e: unknown) {
          return Response.json(
            { error: (e as Error).message },
            { status: 400 },
          );
        }
        // Validate total matches amount
        const total = splits.reduce((s, sp) => s + sp.share_amount, 0);
        if (Math.abs(total - amount) > 0.01) {
          return Response.json(
            {
              error: `Custom shares (${total.toFixed(2)}) must equal amount (${amount.toFixed(2)})`,
            },
            { status: 400 },
          );
        }
        break;
      }
      case 'percentage': {
        if (!split_data || typeof split_data !== 'object') {
          return Response.json(
            { error: 'split_data object is required for percentage split' },
            { status: 400 },
          );
        }
        try {
          splits = percentageSplit('', amount, split_data);
        } catch (e: unknown) {
          return Response.json(
            { error: (e as Error).message },
            { status: 400 },
          );
        }
        break;
      }
      default:
        return Response.json(
          { error: 'Invalid split_method' },
          { status: 400 },
        );
    }

    // -- create expense --
    const expense = await createExpense({
      group_id: groupId,
      paid_by,
      amount,
      description: description ?? '',
      category: category ?? '',
      is_recurring: is_recurring ?? false,
      recurring_frequency,
    });

    // -- create splits --
    for (const split of splits) {
      await createExpenseSplit({ ...split, expense_id: expense.id });
    }

    return Response.json(
      {
        ...expense,
        splits: splits.map((s) => ({ ...s, expense_id: expense.id })),
      },
      { status: 201 },
    );
  } catch (err) {
    return Response.json(
      { error: 'Failed to create expense', details: String(err) },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/groups/[id]/expenses  —  list group expenses with splits
// ---------------------------------------------------------------------------
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

    const expenses = await getGroupExpenses(groupId);

    const result = await Promise.all(
      expenses.map(async (exp) => ({
        ...exp,
        splits: await getExpenseSplits(exp.id),
      })),
    );

    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: 'Failed to list expenses', details: String(err) },
      { status: 500 },
    );
  }
}

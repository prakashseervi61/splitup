import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  getGroup,
  getGroupMembers,
  createExpense,
  createExpenseSplitsBatch,
  getGroupExpenses,
  getExpenseSplitsBatch,
} from '@/lib/db/store';
import {
  equalSplit,
  customSplit,
  percentageSplit,
} from '@/lib/utils/split';

// ---------------------------------------------------------------------------
// POST /api/groups/[id]/expenses  —  add an expense
// ---------------------------------------------------------------------------
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
        { error: 'split_method must be one of: equal, custom, percentage' },
        { status: 400 },
      );
    }

    const members = await getGroupMembers(groupId);
    const memberIds = members.map((m) => m.user_id);

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
        const total = splits.reduce((s, sp) => s + sp.share_amount, 0);
        if (Math.abs(total - amount) > 0.01) {
          return Response.json(
            { error: `Custom shares (${total.toFixed(2)}) must equal amount (${amount.toFixed(2)})` },
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

    const expense = await createExpense({
      group_id: groupId,
      paid_by,
      amount,
      description: description ?? '',
      category: category ?? '',
      is_recurring: is_recurring ?? false,
      recurring_frequency,
    });

    await createExpenseSplitsBatch(
      splits.map((s) => ({ ...s, expense_id: expense.id })),
    );

    revalidatePath('/groups/' + groupId);

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
// GET /api/groups/[id]/expenses  —  list group expenses with pagination
// Query params: ?limit=20&before=<ISO timestamp>
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: groupId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
    const before = searchParams.get('before');

    const group = await getGroup(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    let expenses = await getGroupExpenses(groupId);

    if (before) {
      const beforeDate = new Date(before);
      expenses = expenses.filter((e) => new Date(e.created_at) < beforeDate);
    }

    expenses = expenses.slice(0, limit);

    const expenseIds = expenses.map((exp) => exp.id);
    const allSplits = await getExpenseSplitsBatch(expenseIds);

    const splitsByExpense = new Map<string, typeof allSplits>();
    for (const split of allSplits) {
      const list = splitsByExpense.get(split.expense_id) ?? [];
      list.push(split);
      splitsByExpense.set(split.expense_id, list);
    }

    const result = expenses.map((exp) => ({
      ...exp,
      splits: splitsByExpense.get(exp.id) ?? [],
    }));

    return Response.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' },
    });
  } catch (err) {
    return Response.json(
      { error: 'Failed to list expenses', details: String(err) },
      { status: 500 },
    );
  }
}

import { createAdminClient } from '@/lib/supabase/server';
import type {
  User,
  Group,
  GroupMember,
  Expense,
  ExpenseSplit,
  Settlement,
  RecurringTemplate,
} from '@/types';
import { computeNetBalances } from '@/lib/utils/split';

// ---------------------------------------------------------------------------
// Admin client — bypasses RLS, server-only
// ---------------------------------------------------------------------------

const supabase = createAdminClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a DB row (numeric as string) to a typed number. */
function toNum(v: unknown): number {
  return typeof v === 'string' ? Number.parseFloat(v) : Number(v);
}

function toExpense(row: Record<string, unknown>): Expense {
  return { ...row, amount: toNum(row.amount) } as unknown as Expense;
}

function toSplit(row: Record<string, unknown>): ExpenseSplit {
  return { ...row, share_amount: toNum(row.share_amount) } as unknown as ExpenseSplit;
}

function toSettlement(row: Record<string, unknown>): Settlement {
  return {
    ...row,
    amount: toNum(row.amount),
  } as unknown as Settlement;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function findUserByPhone(
  phone: string,
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) throw new Error(`Failed to find user: ${error.message}`);
  return data as User | null;
}

export async function findUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to find user: ${error.message}`);
  return data as User | null;
}

export async function findUsersByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', ids);
  if (error) throw new Error(`Failed to find users: ${error.message}`);
  return (data ?? []) as User[];
}

export async function createUser(data: {
  id?: string;
  phone: string;
  name: string;
  default_vpa?: string;
}): Promise<User> {
  const insertData: Record<string, unknown> = {
    phone: data.phone,
    name: data.name,
    default_vpa: data.default_vpa ?? '',
  };
  if (data.id) insertData.id = data.id;

  const { data: user, error } = await supabase
    .from('users')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return user as User;
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export async function getGroup(id: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to get group: ${error.message}`);
  return data as Group | null;
}

export async function listUserGroups(userId: string): Promise<Group[]> {
  // Get group IDs the user belongs to
  const { data: memberships, error: membershipError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (membershipError)
    throw new Error(`Failed to list groups: ${membershipError.message}`);

  const groupIds = (memberships ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) return [];

  // Fetch matching groups
  const { data: groups, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds);

  if (groupError)
    throw new Error(`Failed to list groups: ${groupError.message}`);

  return (groups ?? []) as Group[];
}

export async function createGroup(data: {
  name: string;
  type: 'pg' | 'hostel' | 'trip';
  created_by: string;
}): Promise<Group> {
  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name: data.name,
      type: data.type,
      created_by: data.created_by,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create group: ${error.message}`);
  return group as Group;
}

export async function addGroupMember(
  groupId: string,
  userId: string,
): Promise<GroupMember> {
  const { data, error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(`Failed to add group member: ${error.message}`);
  return data as GroupMember;
}

export async function getGroupMembers(
  groupId: string,
): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId);

  if (error) throw new Error(`Failed to get members: ${error.message}`);
  return (data ?? []) as GroupMember[];
}

export async function isGroupMember(
  groupId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to check membership: ${error.message}`);
  return data !== null;
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export async function createExpense(data: {
  group_id: string;
  paid_by: string;
  amount: number;
  description: string;
  category: string;
  is_recurring?: boolean;
  recurring_frequency?: 'monthly' | 'weekly' | 'daily';
}): Promise<Expense> {
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      group_id: data.group_id,
      paid_by: data.paid_by,
      amount: data.amount,
      description: data.description ?? '',
      category: data.category ?? '',
      is_recurring: data.is_recurring ?? false,
      recurring_frequency: data.recurring_frequency ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create expense: ${error.message}`);
  return toExpense(expense as Record<string, unknown>);
}

export async function getGroupExpenses(
  groupId: string,
): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get expenses: ${error.message}`);
  return (data ?? []).map((e) => toExpense(e as Record<string, unknown>));
}

export async function getExpense(id: string): Promise<Expense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to get expense: ${error.message}`);
  return data ? toExpense(data as Record<string, unknown>) : null;
}

// ---------------------------------------------------------------------------
// Expense Splits
// ---------------------------------------------------------------------------

export async function createExpenseSplit(split: ExpenseSplit): Promise<void> {
  const { error } = await supabase.from('expense_splits').insert({
    expense_id: split.expense_id,
    user_id: split.user_id,
    share_amount: split.share_amount,
  });

  if (error) throw new Error(`Failed to create split: ${error.message}`);
}

export async function getExpenseSplits(
  expenseId: string,
): Promise<ExpenseSplit[]> {
  const { data, error } = await supabase
    .from('expense_splits')
    .select('*')
    .eq('expense_id', expenseId);

  if (error) throw new Error(`Failed to get splits: ${error.message}`);
  return (data ?? []).map((s) => toSplit(s as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// Settlements
// ---------------------------------------------------------------------------

export async function createSettlement(data: {
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  note?: string;
}): Promise<Settlement> {
  const { data: settlement, error } = await supabase
    .from('settlements')
    .insert({
      group_id: data.group_id,
      from_user: data.from_user,
      to_user: data.to_user,
      amount: data.amount,
      note: data.note ?? '',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create settlement: ${error.message}`);
  return toSettlement(settlement as Record<string, unknown>);
}

export async function updateSettlementStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'disputed',
): Promise<Settlement | null> {
  const updateData: Record<string, unknown> = { status };
  if (status === 'confirmed') {
    updateData.settled_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('settlements')
    .update(updateData)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error)
    throw new Error(`Failed to update settlement: ${error.message}`);
  return data ? toSettlement(data as Record<string, unknown>) : null;
}

export async function getGroupSettlements(
  groupId: string,
): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get settlements: ${error.message}`);
  return (data ?? []).map((s) => toSettlement(s as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// Recurring Templates
// ---------------------------------------------------------------------------

function toTemplate(row: Record<string, unknown>): RecurringTemplate {
  return {
    ...row,
    amount: toNum(row.amount),
  } as unknown as RecurringTemplate;
}

export async function listRecurringTemplates(
  groupId: string,
): Promise<RecurringTemplate[]> {
  const { data, error } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list templates: ${error.message}`);
  return (data ?? []).map((t) => toTemplate(t as Record<string, unknown>));
}

export async function createRecurringTemplate(data: {
  group_id: string;
  created_by: string;
  description: string;
  amount: number;
  category?: string;
  split_type: 'equal' | 'custom' | 'percentage';
  split_data?: Record<string, number>;
  day_of_month?: number;
}): Promise<RecurringTemplate> {
  const { data: template, error } = await supabase
    .from('recurring_templates')
    .insert({
      group_id: data.group_id,
      created_by: data.created_by,
      description: data.description,
      amount: data.amount,
      category: data.category ?? 'Other',
      split_type: data.split_type,
      split_data: data.split_data ?? {},
      day_of_month: data.day_of_month ?? 1,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create template: ${error.message}`);
  return toTemplate(template as Record<string, unknown>);
}

export async function updateRecurringTemplate(
  id: string,
  data: Partial<{
    description: string;
    amount: number;
    category: string;
    split_type: 'equal' | 'custom' | 'percentage';
    split_data: Record<string, number>;
    day_of_month: number;
    is_active: boolean;
  }>,
): Promise<RecurringTemplate | null> {
  const { data: template, error } = await supabase
    .from('recurring_templates')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Failed to update template: ${error.message}`);
  return template ? toTemplate(template as Record<string, unknown>) : null;
}

export async function deleteRecurringTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('recurring_templates')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete template: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function updateUserProfile(
  id: string,
  data: { name?: string; default_vpa?: string },
): Promise<User | null> {
  const { data: user, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
  return user as User | null;
}

// ---------------------------------------------------------------------------
// Balances
// ---------------------------------------------------------------------------

export async function computeBalances(
  groupId: string,
): Promise<Record<string, number>> {
  // Fetch all data needed for balance computation
  const expenses = await getGroupExpenses(groupId);

  // Fetch all splits for this group's expenses
  const expenseIds = expenses.map((e) => e.id);
  let allSplits: ExpenseSplit[] = [];
  if (expenseIds.length > 0) {
    const { data: splits, error: splitsError } = await supabase
      .from('expense_splits')
      .select('*')
      .in('expense_id', expenseIds);

    if (splitsError)
      throw new Error(`Failed to get splits: ${splitsError.message}`);
    allSplits = (splits ?? []).map((s) =>
      toSplit(s as Record<string, unknown>),
    );
  }

  const settlements = await getGroupSettlements(groupId);

  // Use the pure compute function from split.ts
  return computeNetBalances('', expenses, allSplits, settlements);
}

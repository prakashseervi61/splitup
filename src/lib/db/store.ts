import type { User, Group, GroupMember, Expense, ExpenseSplit, Settlement } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Store {
  users: User[];
  groups: Group[];
  groupMembers: GroupMember[];
  expenses: Expense[];
  expenseSplits: ExpenseSplit[];
  settlements: Settlement[];
}

// ---------------------------------------------------------------------------
// Singleton in-memory store
// ---------------------------------------------------------------------------

// ponytail: seed a mock user so the app works without auth
const MOCK_USER: User = {
  id: 'user-1',
  phone: '+919999999999',
  name: 'You',
  default_vpa: 'you@upi',
  created_at: new Date().toISOString(),
};

const store: Store = {
  users: [MOCK_USER],
  groups: [],
  groupMembers: [],
  expenses: [],
  expenseSplits: [],
  settlements: [],
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function findUserByPhone(phone: string): User | undefined {
  return store.users.find((u) => u.phone === phone);
}

export function findUserById(id: string): User | undefined {
  return store.users.find((u) => u.id === id);
}

export function createUser(data: {
  phone: string;
  name: string;
  default_vpa?: string;
}): User {
  const user: User = {
    id: crypto.randomUUID(),
    phone: data.phone,
    name: data.name,
    default_vpa: data.default_vpa ?? '',
    created_at: new Date().toISOString(),
  };
  store.users.push(user);
  return user;
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export function getGroup(id: string): Group | undefined {
  return store.groups.find((g) => g.id === id);
}

export function listUserGroups(userId: string): Group[] {
  const groupIds = store.groupMembers
    .filter((m) => m.user_id === userId)
    .map((m) => m.group_id);
  return store.groups.filter((g) => groupIds.includes(g.id));
}

export function createGroup(data: {
  name: string;
  type: 'pg' | 'hostel' | 'trip';
  created_by: string;
}): Group {
  const group: Group = {
    id: crypto.randomUUID(),
    name: data.name,
    type: data.type,
    created_by: data.created_by,
    created_at: new Date().toISOString(),
  };
  store.groups.push(group);
  return group;
}

export function addGroupMember(
  groupId: string,
  userId: string,
): GroupMember {
  const member: GroupMember = {
    group_id: groupId,
    user_id: userId,
    joined_at: new Date().toISOString(),
  };
  store.groupMembers.push(member);
  return member;
}

export function getGroupMembers(groupId: string): GroupMember[] {
  return store.groupMembers.filter((m) => m.group_id === groupId);
}

export function isGroupMember(groupId: string, userId: string): boolean {
  return store.groupMembers.some(
    (m) => m.group_id === groupId && m.user_id === userId,
  );
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export function createExpense(data: {
  group_id: string;
  paid_by: string;
  amount: number;
  description: string;
  category: string;
  is_recurring?: boolean;
  recurring_frequency?: 'monthly' | 'weekly' | 'daily';
}): Expense {
  const expense: Expense = {
    id: crypto.randomUUID(),
    group_id: data.group_id,
    paid_by: data.paid_by,
    amount: data.amount,
    description: data.description,
    category: data.category,
    created_at: new Date().toISOString(),
    is_recurring: data.is_recurring ?? false,
    recurring_frequency: data.recurring_frequency,
  };
  store.expenses.push(expense);
  return expense;
}

export function getGroupExpenses(groupId: string): Expense[] {
  return store.expenses.filter((e) => e.group_id === groupId);
}

export function getExpense(id: string): Expense | undefined {
  return store.expenses.find((e) => e.id === id);
}

// ---------------------------------------------------------------------------
// Expense Splits
// ---------------------------------------------------------------------------

export function createExpenseSplit(split: ExpenseSplit): void {
  store.expenseSplits.push(split);
}

export function getExpenseSplits(expenseId: string): ExpenseSplit[] {
  return store.expenseSplits.filter((s) => s.expense_id === expenseId);
}

// ---------------------------------------------------------------------------
// Settlements
// ---------------------------------------------------------------------------

export function createSettlement(data: {
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  note?: string;
}): Settlement {
  const settlement: Settlement = {
    id: crypto.randomUUID(),
    group_id: data.group_id,
    from_user: data.from_user,
    to_user: data.to_user,
    amount: data.amount,
    status: 'pending',
    note: data.note ?? '',
    created_at: new Date().toISOString(),
  };
  store.settlements.push(settlement);
  return settlement;
}

export function updateSettlementStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'disputed',
): Settlement | undefined {
  const settlement = store.settlements.find((s) => s.id === id);
  if (!settlement) return undefined;
  settlement.status = status;
  if (status === 'confirmed') {
    settlement.settled_at = new Date().toISOString();
  }
  return settlement;
}

export function getGroupSettlements(groupId: string): Settlement[] {
  return store.settlements.filter((s) => s.group_id === groupId);
}

// ---------------------------------------------------------------------------
// Balances
// ---------------------------------------------------------------------------

/** Compute net balances from expenses and settlements for a group.
 *
 *  Positive balance = user is owed money (credit).
 *  Negative balance = user owes money (debt).
 */
export function computeBalances(
  groupId: string,
): Record<string, number> {
  const groupExpenses = getGroupExpenses(groupId);
  const groupSettlements = getGroupSettlements(groupId);

  const balances: Record<string, number> = {};

  // Helper to ensure a key exists
  const ensure = (id: string) => {
    if (!(id in balances)) balances[id] = 0;
  };

  // Process expenses
  for (const expense of groupExpenses) {
    const payer = expense.paid_by;
    ensure(payer);
    balances[payer] += expense.amount; // payer is owed the full amount

    const splits = getExpenseSplits(expense.id);
    for (const split of splits) {
      ensure(split.user_id);
      balances[split.user_id] -= split.share_amount; // each member owes their share
    }
  }

  // Process confirmed settlements
  for (const settlement of groupSettlements) {
    if (settlement.status !== 'confirmed') continue;
    ensure(settlement.from_user);
    ensure(settlement.to_user);
    balances[settlement.from_user] += settlement.amount; // debtor's balance improves
    balances[settlement.to_user] -= settlement.amount; // creditor's balance decreases
  }

  return balances;
}

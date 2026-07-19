import type { Expense, ExpenseSplit, Settlement } from '@/types';

// ---------------------------------------------------------------------------
// Equal split
// ---------------------------------------------------------------------------
// Divides amount equally among members. Rounds to 2 decimal places.
// The last person receives any remainder to absorb rounding error.

export function equalSplit(
  expenseId: string,
  amount: number,
  members: string[],
): ExpenseSplit[] {
  if (members.length === 0) return [];

  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / members.length);
  const remainderCents = totalCents - baseCents * members.length;

  return members.map((userId, i) => ({
    expense_id: expenseId,
    user_id: userId,
    share_amount:
      (baseCents + (i === members.length - 1 ? remainderCents : 0)) / 100,
  }));
}

// ---------------------------------------------------------------------------
// Custom split
// ---------------------------------------------------------------------------
// Each member gets the exact share specified. All values must be >= 0.

export function customSplit(
  expenseId: string,
  shares: Record<string, number>,
): ExpenseSplit[] {
  const entries = Object.entries(shares);
  if (entries.length === 0) return [];

  for (const [userId, amount] of entries) {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error(
        `Invalid share amount for user "${userId}": ${amount}`,
      );
    }
    if (amount === 0) continue; // skip zero-share entries (e.g. someone not included)
  }

  return entries
    .filter(([, amount]) => amount > 0)
    .map(([userId, shareAmount]) => ({
      expense_id: expenseId,
      user_id: userId,
      share_amount: Math.round(shareAmount * 100) / 100,
    }));
}

// ---------------------------------------------------------------------------
// Percentage split
// ---------------------------------------------------------------------------
// Converts percentage shares to amounts. Percentages must sum to 100 (±0.01).

export function percentageSplit(
  expenseId: string,
  amount: number,
  percentages: Record<string, number>,
): ExpenseSplit[] {
  const entries = Object.entries(percentages);
  if (entries.length === 0) return [];

  const totalPct = Object.values(percentages).reduce((s, v) => s + v, 0);
  if (Math.abs(totalPct - 100) > 0.01) {
    throw new Error(
      `Percentages must sum to 100 (got ${totalPct})`,
    );
  }

  const amountCents = Math.round(amount * 100);
  let allocatedCents = 0;

  const splits: ExpenseSplit[] = entries.map(([userId, pct], i) => {
    // Last entry gets whatever remains to avoid rounding drift
    if (i === entries.length - 1) {
      const remaining = amountCents - allocatedCents;
      return {
        expense_id: expenseId,
        user_id: userId,
        share_amount: remaining / 100,
      };
    }
    const share = Math.round(amountCents * (pct / 100));
    allocatedCents += share;
    return {
      expense_id: expenseId,
      user_id: userId,
      share_amount: share / 100,
    };
  });

  return splits;
}

// ---------------------------------------------------------------------------
// Compute net balances
// ---------------------------------------------------------------------------
// Positive = user is owed money. Negative = user owes money.

export function computeNetBalances(
  _groupId: string,
  expenses: Expense[],
  expenseSplits: ExpenseSplit[],
  settlements: Settlement[],
): Record<string, number> {
  const balances: Record<string, number> = {};

  const ensure = (id: string) => {
    if (!(id in balances)) balances[id] = 0;
  };

  const splitsByExpense: Record<string, ExpenseSplit[]> = {};
  for (const s of expenseSplits) {
    if (!splitsByExpense[s.expense_id]) splitsByExpense[s.expense_id] = [];
    splitsByExpense[s.expense_id].push(s);
  }

  for (const expense of expenses) {
    ensure(expense.paid_by);
    balances[expense.paid_by] += expense.amount;

    const splits = splitsByExpense[expense.id] ?? [];
    for (const split of splits) {
      ensure(split.user_id);
      balances[split.user_id] -= split.share_amount;
    }
  }

  for (const settlement of settlements) {
    if (settlement.status !== 'confirmed') continue;
    ensure(settlement.from_user);
    ensure(settlement.to_user);
    balances[settlement.from_user] += settlement.amount;
    balances[settlement.to_user] -= settlement.amount;
  }

  return balances;
}

// ---------------------------------------------------------------------------
// Simplify debts — minimise number of transactions
// ---------------------------------------------------------------------------
// Greedy algorithm: repeatedly match the largest creditor with the largest
// debtor until all balances are zero.

export function simplifyDebts(
  balances: Record<string, number>,
): { from: string; to: string; amount: number }[] {
  // Filter out zero balances and sort
  const pos: { id: string; amount: number }[] = [];
  const neg: { id: string; amount: number }[] = [];

  for (const [id, bal] of Object.entries(balances)) {
    if (Math.abs(bal) < 0.005) continue; // effectively zero
    if (bal > 0) pos.push({ id, amount: bal });
    else neg.push({ id, amount: -bal });
  }

  // Sort descending
  pos.sort((a, b) => b.amount - a.amount);
  neg.sort((a, b) => b.amount - a.amount);

  const transactions: { from: string; to: string; amount: number }[] = [];

  let i = 0;
  let j = 0;
  while (i < pos.length && j < neg.length) {
    const transfer = Math.min(pos[i].amount, neg[j].amount);
    // Round to 2 decimals
    const rounded = Math.round(transfer * 100) / 100;
    if (rounded > 0) {
      transactions.push({
        from: neg[j].id,
        to: pos[i].id,
        amount: rounded,
      });
    }

    pos[i].amount -= transfer;
    neg[j].amount -= transfer;

    if (Math.abs(pos[i].amount) < 0.005) i++;
    if (Math.abs(neg[j].amount) < 0.005) j++;
  }

  return transactions;
}

import { describe, it, expect } from 'vitest';
import {
  equalSplit,
  customSplit,
  percentageSplit,
  computeNetBalances,
  simplifyDebts,
} from './split';
import type { Expense, ExpenseSplit, Settlement } from '@/types';

// ---------------------------------------------------------------------------
// equalSplit
// ---------------------------------------------------------------------------

describe('equalSplit', () => {
  it('divides equally among 3 members with remainder on last', () => {
    const result = equalSplit('e1', 100, ['a', 'b', 'c']);
    expect(result).toHaveLength(3);
    expect(result[0].share_amount).toBe(33.33);
    expect(result[1].share_amount).toBe(33.33);
    expect(result[2].share_amount).toBe(33.34);
    const total = result.reduce((s, r) => s + r.share_amount, 0);
    expect(total).toBe(100);
  });

  it('divides equally among 2 members with no remainder', () => {
    const result = equalSplit('e2', 100, ['a', 'b']);
    expect(result).toHaveLength(2);
    expect(result[0].share_amount).toBe(50);
    expect(result[1].share_amount).toBe(50);
  });

  it('single member gets the full amount', () => {
    const result = equalSplit('e3', 100, ['a']);
    expect(result).toHaveLength(1);
    expect(result[0].share_amount).toBe(100);
  });

  it('handles small amounts with rounding', () => {
    const result = equalSplit('e4', 1, ['a', 'b', 'c']);
    expect(result).toHaveLength(3);
    expect(result[0].share_amount).toBe(0.33);
    expect(result[1].share_amount).toBe(0.33);
    expect(result[2].share_amount).toBe(0.34);
    const total = result.reduce((s, r) => s + r.share_amount, 0);
    expect(total).toBe(1);
  });

  it('returns empty array for no members', () => {
    const result = equalSplit('e5', 100, []);
    expect(result).toEqual([]);
  });

  it('assigns expense_id correctly', () => {
    const result = equalSplit('exp-1', 50, ['x', 'y']);
    for (const r of result) {
      expect(r.expense_id).toBe('exp-1');
    }
  });
});

// ---------------------------------------------------------------------------
// customSplit
// ---------------------------------------------------------------------------

describe('customSplit', () => {
  it('creates splits from provided shares', () => {
    const result = customSplit('e1', { a: 25, b: 75 });
    expect(result).toHaveLength(2);
    expect(result[0].share_amount).toBe(25);
    expect(result[1].share_amount).toBe(75);
  });

  it('returns empty array for empty shares', () => {
    const result = customSplit('e2', {});
    expect(result).toEqual([]);
  });

  it('filters out zero-share entries', () => {
    const result = customSplit('e3', { a: 40, b: 0, c: 60 });
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.user_id === 'b')).toBeUndefined();
  });

  it('throws for negative share', () => {
    expect(() => customSplit('e4', { a: -10 })).toThrow(
      'Invalid share amount',
    );
  });

  it('rounds share amounts to 2 decimals', () => {
    const result = customSplit('e5', { a: 33.333, b: 66.667 });
    expect(result[0].share_amount).toBe(33.33);
    expect(result[1].share_amount).toBe(66.67);
  });
});

// ---------------------------------------------------------------------------
// percentageSplit
// ---------------------------------------------------------------------------

describe('percentageSplit', () => {
  it('converts 50/50 split correctly', () => {
    const result = percentageSplit('e1', 100, { a: 50, b: 50 });
    expect(result).toHaveLength(2);
    expect(result[0].share_amount).toBe(50);
    expect(result[1].share_amount).toBe(50);
  });

  it('handles 3-way percentage with rounding', () => {
    const result = percentageSplit('e2', 100, {
      a: 33.33,
      b: 33.33,
      c: 33.34,
    });
    expect(result).toHaveLength(3);
    const total = result.reduce((s, r) => s + r.share_amount, 0);
    expect(total).toBeCloseTo(100, 2);
  });

  it('throws if percentages do not sum to 100', () => {
    expect(() =>
      percentageSplit('e3', 100, { a: 50, b: 49 }),
    ).toThrow('Percentages must sum to 100');
  });

  it('throws if percentages sum over 100', () => {
    expect(() =>
      percentageSplit('e4', 100, { a: 60, b: 50 }),
    ).toThrow('Percentages must sum to 100');
  });

  it('handles single member 100%', () => {
    const result = percentageSplit('e5', 200, { a: 100 });
    expect(result).toHaveLength(1);
    expect(result[0].share_amount).toBe(200);
  });

  it('handles odd amounts with round percentages', () => {
    const result = percentageSplit('e6', 333, { a: 33.33, b: 33.33, c: 33.34 });
    const total = result.reduce((s, r) => s + r.share_amount, 0);
    expect(total).toBeCloseTo(333, 2);
  });
});

// ---------------------------------------------------------------------------
// computeNetBalances
// ---------------------------------------------------------------------------

function expense(
  id: string,
  groupId: string,
  paidBy: string,
  amount: number,
): Expense {
  return {
    id,
    group_id: groupId,
    paid_by: paidBy,
    amount,
    description: '',
    category: '',
    created_at: '',
    is_recurring: false,
  };
}

function split(
  expenseId: string,
  userId: string,
  shareAmount: number,
): ExpenseSplit {
  return { expense_id: expenseId, user_id: userId, share_amount: shareAmount };
}

function settlement(
  from: string,
  to: string,
  amount: number,
  status: 'pending' | 'confirmed' | 'disputed' = 'confirmed',
): Settlement {
  return {
    id: '',
    group_id: '',
    from_user: from,
    to_user: to,
    amount,
    status,
    note: '',
    created_at: '',
  };
}

describe('computeNetBalances', () => {
  it('simple 2-person expense: A pays 100, equal split with B', () => {
    const exps = [expense('e1', 'g1', 'a', 100)];
    const splits = [split('e1', 'a', 50), split('e1', 'b', 50)];
    const balance = computeNetBalances('g1', exps, splits, []);
    expect(balance['a']).toBe(50); // A paid 100, owes 50 => +50
    expect(balance['b']).toBe(-50); // B owes 50 => -50
  });

  it('3-person with 2 expenses and partial settlement', () => {
    const exps = [
      expense('e1', 'g1', 'a', 90),
      expense('e2', 'g1', 'b', 60),
    ];
    const splits = [
      split('e1', 'a', 30), split('e1', 'b', 30), split('e1', 'c', 30),
      split('e2', 'a', 20), split('e2', 'b', 20), split('e2', 'c', 20),
    ];
    const settlements = [settlement('c', 'a', 40)];

    const balance = computeNetBalances('g1', exps, splits, settlements);

    // e1: A pays 90, each owes 30 => A:+60, B:-30, C:-30
    // e2: B pays 60, each owes 20 => A:-20, B:+40, C:-20
    // net before settlement: A:+40, B:+10, C:-50
    // settlement C→A 40: C:+40, A:-40
    // final: A:0, B:+10, C:-10
    expect(balance['a']).toBeCloseTo(0, 1);
    expect(balance['b']).toBeCloseTo(10, 1);
    expect(balance['c']).toBeCloseTo(-10, 1);
  });

  it('ignores pending settlements', () => {
    const exps = [expense('e1', 'g1', 'a', 100)];
    const splits = [split('e1', 'a', 50), split('e1', 'b', 50)];
    const pendingSettlements = [
      {
        ...settlement('b', 'a', 50),
        status: 'pending' as const,
      },
    ];
    const balance = computeNetBalances(
      'g1',
      exps,
      splits,
      pendingSettlements,
    );
    // Settlement is pending, so not factored in
    expect(balance['a']).toBe(50);
    expect(balance['b']).toBe(-50);
  });

  it('handles empty expenses', () => {
    const balance = computeNetBalances('g1', [], [], []);
    expect(balance).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// simplifyDebts
// ---------------------------------------------------------------------------

describe('simplifyDebts', () => {
  it('simplifies 3-person cycle to 2 transactions', () => {
    // A:+30, B:-10, C:-20
    const txns = simplifyDebts({ a: 30, b: -10, c: -20 });
    expect(txns).toHaveLength(2);

    // The smallest number of transactions: B→A 10, C→A 20
    const totalFromB = txns
      .filter((t) => t.from === 'b')
      .reduce((s, t) => s + t.amount, 0);
    const totalFromC = txns
      .filter((t) => t.from === 'c')
      .reduce((s, t) => s + t.amount, 0);
    const totalToA = txns
      .filter((t) => t.to === 'a')
      .reduce((s, t) => s + t.amount, 0);

    expect(totalFromB).toBeCloseTo(10, 2);
    expect(totalFromC).toBeCloseTo(20, 2);
    expect(totalToA).toBeCloseTo(30, 2);
  });

  it('returns empty array when all balances are zero', () => {
    const txns = simplifyDebts({ a: 0, b: 0 });
    expect(txns).toEqual([]);
  });

  it('handles 2-person debt directly', () => {
    // A:+50, B:-50
    const txns = simplifyDebts({ a: 50, b: -50 });
    expect(txns).toHaveLength(1);
    expect(txns[0].from).toBe('b');
    expect(txns[0].to).toBe('a');
    expect(txns[0].amount).toBe(50);
  });

  it('handles single person (no transactions needed)', () => {
    const txns = simplifyDebts({ a: 100 });
    expect(txns).toEqual([]);
  });
});

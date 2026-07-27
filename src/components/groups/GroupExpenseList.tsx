'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useUser } from '@/lib/user-context';
import AddExpenseForm from './AddExpenseForm';

interface ExpenseSplit {
  user_id: string;
  share_amount: number;
}

interface Expense {
  id: string;
  paid_by: string;
  amount: number;
  description: string;
  category: string;
  created_at: string;
  splits: ExpenseSplit[];
}

interface Member {
  user_id: string;
}

interface GroupExpenseListProps {
  initialExpenses: Expense[];
  groupId: string;
  members: Member[];
  userId: string;
  onRefresh: () => void;
}

import { categoryDots, formatDate, formatDateGroup } from '@/lib/constants';



export default function GroupExpenseList({
  initialExpenses,
  groupId,
  members,
  userId,
  onRefresh,
}: GroupExpenseListProps) {
  const { getUserName } = useUser();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const handler = () => setShowForm(true);
    window.addEventListener('shortcut:add-expense', handler);
    return () => window.removeEventListener('shortcut:add-expense', handler);
  }, []);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialExpenses.length >= 20);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [optimisticExpenses, addOptimisticExpense] = useState<Expense[]>([]);

  const allExpenses = useMemo(
    () => [...optimisticExpenses, ...expenses],
    [optimisticExpenses, expenses],
  );

  const grouped = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    for (const exp of allExpenses) {
      const key = new Date(exp.created_at).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(exp);
    }
    return groups;
  }, [allExpenses]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const lastExpense = expenses[expenses.length - 1];
      if (!lastExpense) {
        setHasMore(false);
        return;
      }
      const res = await fetch(
        `/api/groups/${groupId}/expenses?limit=20&before=${encodeURIComponent(lastExpense.created_at)}`,
      );
      if (!res.ok) throw new Error('Failed to load more');
      const data: Expense[] = await res.json();
      if (data.length < 20) {
        setHasMore(false);
      }
      setExpenses((prev) => [...prev, ...data]);
    } catch {
      // silently fail — user can retry by scrolling
    } finally {
      setLoadingMore(false);
    }
  }, [expenses, groupId, loadingMore, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-heading">Expenses</h3>
        <button
          onClick={() => setShowForm(true)}
          data-walkthrough="add-expense"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark active:bg-primary-active"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {allExpenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-divider py-12 text-center">
          <p className="text-sm font-medium text-text-body">No expenses yet</p>
          <p className="mt-1 text-xs text-text-muted">
            Tap the button above to add the first one
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([dateKey, exps]) => (
            <div key={dateKey}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {formatDateGroup(exps[0].created_at)}
              </p>
              <div className="space-y-1.5">
                {exps.map((exp) => {
                  const payerInitial = getUserName(exp.paid_by).charAt(0).toUpperCase();
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-divider"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-bold text-primary">
                        {payerInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-heading">
                          {exp.description || 'Untitled'}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                          <span>{getUserName(exp.paid_by)} paid</span>
                          <span className="text-border">·</span>
                          <span>{formatDate(exp.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-2 w-2 rounded-full ${categoryDots[exp.category] ?? categoryDots['Other']}`} />
                        <span className="text-sm font-semibold text-text-heading tabular-nums">
                          ₹{exp.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-4" />

          {loadingMore && (
            <div className="space-y-2 py-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-secondary" />
              ))}
            </div>
          )}

          {!hasMore && allExpenses.length > 0 && (
            <p className="py-4 text-center text-xs text-text-muted">
              All expenses loaded
            </p>
          )}
        </div>
      )}

      <AddExpenseForm
        open={showForm}
        onClose={() => setShowForm(false)}
        groupId={groupId}
        members={members}
        userId={userId}
        onCreated={(newExpense: Expense) => {
          addOptimisticExpense((prev) => [newExpense, ...prev]);
          onRefresh();
        }}
      />
    </div>
  );
}

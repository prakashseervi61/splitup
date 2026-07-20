"use client";

import { useState, useMemo } from "react";
import { useUser } from "@/lib/user-context";
import ExpenseForm from "./ExpenseForm";

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

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
  error: string;
  groupId: string;
  members: Member[];
  onRefresh: () => void;
  userId: string;
}

const categoryDots: Record<string, string> = {
  Food: "bg-orange-400",
  Rent: "bg-violet-400",
  Groceries: "bg-lime-500",
  Utilities: "bg-cyan-400",
  Transport: "bg-yellow-500",
  Shopping: "bg-pink-400",
  Entertainment: "bg-purple-400",
  Other: "bg-gray-400",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatDateGroup(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ExpenseList({ expenses, loading, error, groupId, members, onRefresh, userId }: ExpenseListProps) {
  const { getUserName } = useUser();
  const [showForm, setShowForm] = useState(false);

  const grouped = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    for (const exp of expenses) {
      const key = new Date(exp.created_at).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(exp);
    }
    return groups;
  }, [expenses]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-heading">Expenses</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark active:bg-primary-active"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
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
                          {exp.description || "Untitled"}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                          <span>{getUserName(exp.paid_by)} paid</span>
                          <span className="text-border">·</span>
                          <span>{formatDate(exp.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-2 w-2 rounded-full ${categoryDots[exp.category] ?? categoryDots["Other"]}`} />
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
        </div>
      )}

      <ExpenseForm
        open={showForm}
        onClose={() => setShowForm(false)}
        groupId={groupId}
        members={members}
        onCreated={onRefresh}
        userId={userId}
      />
    </div>
  );
}

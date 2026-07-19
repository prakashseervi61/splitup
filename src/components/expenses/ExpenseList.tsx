"use client";

import { useState } from "react";
import { getUserName } from "@/lib/user-cache";
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

const categoryColors: Record<string, string> = {
  Food: "bg-orange-100 text-orange-700",
  Rent: "bg-violet-100 text-violet-700",
  Groceries: "bg-lime-100 text-lime-700",
  Utilities: "bg-cyan-100 text-cyan-700",
  Transport: "bg-yellow-100 text-yellow-700",
  Shopping: "bg-pink-100 text-pink-700",
  Entertainment: "bg-purple-100 text-purple-700",
  Other: "bg-gray-100 text-gray-600",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ExpenseList({ expenses, loading, error, groupId, members, onRefresh, userId }: ExpenseListProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          + Add Expense
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-500">No expenses yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-colors hover:border-gray-200"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {exp.description || "Untitled"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span>{getUserName(exp.paid_by)} paid</span>
                  <span>·</span>
                  <span>{formatDate(exp.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${categoryColors[exp.category] ?? categoryColors["Other"]}`}>
                  {exp.category || "Other"}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{exp.amount.toFixed(2)}
                </span>
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

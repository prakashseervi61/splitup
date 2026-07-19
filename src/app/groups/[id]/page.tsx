"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { setUserName, getUserName } from "@/lib/user-cache";
import ExpenseList from "@/components/expenses/ExpenseList";
import BalanceSheet from "@/components/groups/BalanceSheet";
import SettlementList from "@/components/settlements/SettlementList";

type Tab = "expenses" | "balances" | "settlements";

interface GroupMember {
  user_id: string;
  joined_at: string;
}

interface GroupData {
  id: string;
  name: string;
  type: "pg" | "hostel" | "trip";
  members: GroupMember[];
  balances: Record<string, number>;
}

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

interface Settlement {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: "pending" | "confirmed" | "disputed";
  note: string;
  created_at: string;
}

interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
}

const typeConfig = {
  pg: { label: "PG", color: "bg-blue-100 text-blue-700" },
  hostel: { label: "Hostel", color: "bg-amber-100 text-amber-700" },
  trip: { label: "Trip", color: "bg-emerald-100 text-emerald-700" },
};

const tabs: { key: Tab; label: string }[] = [
  { key: "expenses", label: "Expenses" },
  { key: "balances", label: "Balances" },
  { key: "settlements", label: "Settlements" },
];

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [userId, setUserId] = useState("");

  const [group, setGroup] = useState<GroupData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("expenses");
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState("");

  // Balances
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [simplified, setSimplified] = useState<SimplifiedDebt[] | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState("");

  // Settlements
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settlementsLoading, setSettlementsLoading] = useState(false);
  const [settlementsError, setSettlementsError] = useState("");

  const fetchGroup = useCallback(async () => {
    setPageLoading(true);
    setPageError("");
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Group not found");
      }
      const data: GroupData = await res.json();
      setGroup(data);
      setBalances(data.balances);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setPageLoading(false);
    }
  }, [groupId]);

  const fetchExpenses = useCallback(async () => {
    setExpensesLoading(true);
    setExpensesError("");
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      const data: Expense[] = await res.json();
      setExpenses(data);
    } catch (err) {
      setExpensesError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setExpensesLoading(false);
    }
  }, [groupId]);

  const fetchBalances = useCallback(async () => {
    setBalancesLoading(true);
    setBalancesError("");
    try {
      const res = await fetch(`/api/groups/${groupId}/balances?simplified=true`);
      if (!res.ok) throw new Error("Failed to fetch balances");
      const data = await res.json();
      setBalances(data.balances);
      setSimplified(data.simplified ?? null);
    } catch (err) {
      setBalancesError(err instanceof Error ? err.message : "Failed to load balances");
    } finally {
      setBalancesLoading(false);
    }
  }, [groupId]);

  const fetchSettlements = useCallback(async () => {
    setSettlementsLoading(true);
    setSettlementsError("");
    try {
      const res = await fetch(`/api/groups/${groupId}/settlements`);
      if (!res.ok) throw new Error("Failed to fetch settlements");
      const data: Settlement[] = await res.json();
      setSettlements(data);
    } catch (err) {
      setSettlementsError(err instanceof Error ? err.message : "Failed to load settlements");
    } finally {
      setSettlementsLoading(false);
    }
  }, [groupId]);

  // Initial load
  useEffect(() => {
    fetchGroup();
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => { if (user) setUserId(user.id); })
      .catch(() => {});
  }, [fetchGroup]);

  // Load tab data when switching tabs
  useEffect(() => {
    if (activeTab === "expenses") fetchExpenses();
    else if (activeTab === "balances") fetchBalances();
    else if (activeTab === "settlements") fetchSettlements();
  }, [activeTab, fetchExpenses, fetchBalances, fetchSettlements]);

  if (pageLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="mt-8 h-64 rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (pageError || !group) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
          <p className="text-red-700">{pageError || "Group not found"}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const t = typeConfig[group.type];
  const members = group.members || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Back link */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      {/* Group Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${t.color}`}>
            {t.label}
          </span>
        </div>

        {/* Members */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {members.map((m) => (
            <span
              key={m.user_id}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-[10px] font-bold text-indigo-700">
                {getUserName(m.user_id).charAt(0).toUpperCase()}
              </span>
              {getUserName(m.user_id)}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "expenses" && (
          <ExpenseList
            expenses={expenses}
            loading={expensesLoading}
            error={expensesError}
            groupId={groupId}
            members={members}
            onRefresh={fetchExpenses}
            userId={userId}
          />
        )}

        {activeTab === "balances" && (
          <BalanceSheet
            balances={balances}
            simplified={simplified}
            loading={balancesLoading}
            error={balancesError}
            groupId={groupId}
            members={members}
            onRefresh={() => {
              fetchBalances();
              fetchSettlements();
            }}
          />
        )}

        {activeTab === "settlements" && (
          <SettlementList
            settlements={settlements}
            loading={settlementsLoading}
            error={settlementsError}
            groupId={groupId}
            onRefresh={fetchSettlements}
          />
        )}
      </div>
    </div>
  );
}

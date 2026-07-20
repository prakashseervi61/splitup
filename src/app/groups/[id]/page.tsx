"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import ExpenseList from "@/components/expenses/ExpenseList";
import BalanceSheet from "@/components/groups/BalanceSheet";
import SettlementList from "@/components/settlements/SettlementList";
import SettleFlow from "@/components/settlements/SettleFlow";
import InviteMemberModal from "@/components/groups/InviteMemberModal";

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
  pg: { label: "PG", color: "bg-primary-subtle text-primary" },
  hostel: { label: "Hostel", color: "bg-amber-50 text-warning" },
  trip: { label: "Trip", color: "bg-green-50 text-success" },
};

const tabs: { key: Tab; label: string }[] = [
  { key: "expenses", label: "Expenses" },
  { key: "balances", label: "Balances" },
  { key: "settlements", label: "Settlements" },
];

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const { getUserName, getUserVpa, ensureUsers } = useUser();
  const [userId, setUserId] = useState("");

  const [group, setGroup] = useState<GroupData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("expenses");
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState("");

  const [balances, setBalances] = useState<Record<string, number>>({});
  const [simplified, setSimplified] = useState<SimplifiedDebt[] | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState("");

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGroup();
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => { if (user) setUserId(user.id); })
      .catch(() => {});
  }, [fetchGroup]);

  useEffect(() => {
    if (group?.members?.length) {
      ensureUsers(group.members.map((m) => m.user_id));
    }
  }, [group?.members, ensureUsers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeTab === "expenses") fetchExpenses();
    else if (activeTab === "balances") fetchBalances();
    else if (activeTab === "settlements") fetchSettlements();
  }, [activeTab, fetchExpenses, fetchBalances, fetchSettlements]);

  const [showInvite, setShowInvite] = useState(false);

  const [settleTarget, setSettleTarget] = useState<{
    from: string;
    to: string;
    amount: number;
  } | null>(null);

  if (pageLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-border" />
          <div className="h-4 w-24 rounded bg-border" />
          <div className="mt-8 h-32 rounded-xl bg-surface-secondary" />
          <div className="h-64 rounded-xl bg-surface-secondary" />
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
            href="/dashboard"
            className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-dark"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const t = typeConfig[group.type];
  const members = group.members || [];

  const userBalance = balances[userId] ?? 0;

  const userDebts = simplified?.filter((d) => d.from === userId) ?? [];
  const userReceivables = simplified?.filter((d) => d.to === userId) ?? [];
  const hasUserDebts = userDebts.length > 0;
  const totalUserOwed = userReceivables.reduce((s, d) => s + d.amount, 0);
  const totalUserOwes = userDebts.reduce((s, d) => s + d.amount, 0);

  const handleSettleAll = () => {
    if (userDebts.length > 0) {
      const first = userDebts[0];
      setSettleTarget({
        from: first.from,
        to: first.to,
        amount: first.amount,
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 py-2 text-sm text-text-muted hover:text-text-body"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      {/* Group Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-heading">{group.name}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${t.color}`}>
            {t.label}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {members.map((m) => (
            <span
              key={m.user_id}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-body"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-bold text-primary">
                {getUserName(m.user_id).charAt(0).toUpperCase()}
              </span>
              {getUserName(m.user_id)}
            </span>
          ))}
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Invite
          </button>
        </div>
      </div>

      {/* Balance Overview Banner */}
      {userId && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Your Balance
              </p>
              <p
                className="mt-0.5 text-2xl font-bold tabular-nums"
                style={{
                  color:
                    userBalance > 0
                      ? "#15803D"
                      : userBalance < 0
                        ? "#B91C1C"
                        : "#9CA3AF",
                }}
              >
                {userBalance > 0 ? "+" : ""}₹{Math.abs(userBalance).toFixed(2)}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {userBalance > 0
                  ? `${totalUserOwed > 0 ? `You are owed ₹${totalUserOwed.toFixed(2)}` : "You are owed money"}`
                  : userBalance < 0
                    ? `${hasUserDebts ? `You owe ₹${totalUserOwes.toFixed(2)}` : "You owe money"}`
                    : "All settled up"}
              </p>
            </div>
            {hasUserDebts && (
              <button
                onClick={handleSettleAll}
                className="animate-settle-ripple rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark active:bg-primary-active"
              >
                Settle Now
              </button>
            )}
            {userBalance > 0 && totalUserOwed === 0 && !hasUserDebts && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-success">
                All clear
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex items-end justify-between border-b border-border">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 pt-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-body"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Link
          href={`/groups/${groupId}/recurring`}
          className="pb-3 pt-2 text-xs font-medium text-text-muted transition-colors hover:text-text-body"
        >
          Recurring
        </Link>
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

      {/* Global settle flow when triggered from banner */}
      {settleTarget && !settleTarget.from.includes("placeholder") && (
        <SettleFlow
          open={!!settleTarget}
          onClose={() => setSettleTarget(null)}
          from={settleTarget.from}
          fromName={getUserName(settleTarget.from)}
          to={settleTarget.to}
          toName={getUserName(settleTarget.to)}
          vpa={getUserVpa(settleTarget.to)}
          amount={settleTarget.amount}
          groupId={groupId}
          onComplete={() => {
            setSettleTarget(null);
            fetchBalances();
            fetchSettlements();
          }}
        />
      )}
      {/* Invite Member Modal */}
      <InviteMemberModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        groupId={groupId}
        onMemberAdded={async () => {
          await fetchGroup();
          const res = await fetch(`/api/groups/${groupId}`);
          if (res.ok) {
            const data: GroupData = await res.json();
            ensureUsers(data.members.map((m) => m.user_id));
          }
        }}
      />
    </div>
  );
}

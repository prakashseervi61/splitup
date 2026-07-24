"use client";

import { useState } from "react";
import { useUser } from "@/lib/user-context";
import SettleFlow from "@/components/settlements/SettleFlow";

interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
}

interface BalanceSheetProps {
  balances: Record<string, number>;
  simplified: SimplifiedDebt[] | null;
  loading: boolean;
  error: string;
  groupId: string;
  members: { user_id: string }[];
  onRefresh?: () => void;
}

export default function BalanceSheet({
  balances,
  simplified,
  loading,
  error,
  groupId,
  members,
  onRefresh,
}: BalanceSheetProps) {
  const { getUserName, getUserVpa } = useUser();
  const [showSimplified, setShowSimplified] = useState(true);
  const [settleTarget, setSettleTarget] = useState<{
    from: string;
    to: string;
    amount: number;
  } | null>(null);

  const sortedMembers = [...members].sort((a, b) => {
    const ba = balances[a.user_id] ?? 0;
    const bb = balances[b.user_id] ?? 0;
    return bb - ba;
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-secondary" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  const totalBalance = Object.values(balances).reduce((s, v) => s + Math.abs(v), 0);

  if (totalBalance === 0 && (!simplified || simplified.length === 0)) {
    return (
      <div className="rounded-xl border border-dashed border-divider py-12 text-center">
        <p className="text-sm font-medium text-text-body">All settled up</p>
        <p className="mt-1 text-xs text-text-muted">No outstanding balances</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Net Balances ledger */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
          Net Balances
        </h3>
        <div className="space-y-1">
          {sortedMembers.map((m) => {
            const bal = balances[m.user_id] ?? 0;
            const name = getUserName(m.user_id);
            const isPositive = bal > 0;
            const isNegative = bal < 0;
            const isSettled = bal === 0;
            return (
              <div
                key={m.user_id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-subtle text-xs font-bold text-primary">
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-text-body">{name}</span>
                  {isPositive && (
                    <svg className="ml-1 h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--color-success)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-label="gets money back">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                  {isNegative && (
                    <svg className="ml-1 h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--color-danger)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-label="owes money">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                </div>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={isPositive ? { color: "var(--color-success)" } : isNegative ? { color: "var(--color-danger)" } : { color: "var(--color-text-muted)" }}
                >
                  {isPositive ? "+" : isNegative ? "" : ""}₹{Math.abs(bal).toFixed(2)}
                  {isSettled ? " (settled)" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simplified Settlements */}
      {simplified && simplified.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              Recommended Settlements
            </h3>
            <button
              onClick={() => setShowSimplified(!showSimplified)}
              className="text-xs font-medium text-primary hover:text-primary-dark"
            >
              {showSimplified ? "Hide details" : "Show details"}
            </button>
          </div>

          {showSimplified && (
            <div className="space-y-2">
              {simplified.map((debt, i) => {
                const fromName = getUserName(debt.from);
                const toName = getUserName(debt.to);
                return (
                  <div
                    key={i}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-divider sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-[10px] font-bold text-danger">
                        {fromName.charAt(0).toUpperCase()}
                      </span>
                      <svg className="h-4 w-4 flex-shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-50 text-[10px] font-bold text-success">
                        {toName.charAt(0).toUpperCase()}
                      </span>
                      <p className="truncate text-sm font-medium text-text-body">
                        {fromName} → {toName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 pl-10 sm:pl-0">
                      <span className="text-sm font-semibold text-text-heading tabular-nums">
                        ₹{debt.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() =>
                          setSettleTarget({
                            from: debt.from,
                            to: debt.to,
                            amount: debt.amount,
                          })
                        }
                        className="rounded-lg bg-primary px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark active:bg-primary-active"
                      >
                        Settle Up
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {simplified && simplified.length === 0 && totalBalance > 0 && (
        <div className="rounded-xl border border-dashed border-divider py-8 text-center">
          <p className="text-sm font-medium text-text-body">All settled up</p>
          <p className="mt-1 text-xs text-text-muted">No pending settlements</p>
        </div>
      )}

      {settleTarget && (
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
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}

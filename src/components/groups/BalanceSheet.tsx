"use client";

import { useState } from "react";
import { getUserName, getUserVpa } from "@/lib/user-cache";
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
  const [showSimplified, setShowSimplified] = useState(true);
  const [settleTarget, setSettleTarget] = useState<{
    from: string;
    to: string;
    amount: number;
  } | null>(null);

  const sortedMembers = [...members].sort((a, b) => {
    const ba = balances[a.user_id] ?? 0;
    const bb = balances[b.user_id] ?? 0;
    return bb - ba; // highest balance first
  });

  if (loading) {
    return <div className="py-8 text-center text-sm text-text-muted">Loading balances...</div>;
  }

  if (error) {
    return <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Net Balances */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-text-heading">Net Balances</h3>
        <div className="space-y-1.5">
          {sortedMembers.map((m) => {
            const bal = balances[m.user_id] ?? 0;
            const name = getUserName(m.user_id);
            return (
              <div
                key={m.user_id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
              >
                <span className="text-sm font-medium text-text-body">{name}</span>
                <span
                  className={`text-sm font-semibold ${
                    bal > 0
                      ? "text-success"
                      : bal < 0
                        ? "text-danger"
                        : "text-text-muted"
                  }`}
                >
                  {bal > 0 ? "+" : ""}₹{bal.toFixed(2)}
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
            <h3 className="text-lg font-semibold text-text-heading">Settlements</h3>
            <button
              onClick={() => setShowSimplified(!showSimplified)}
              className="text-xs text-primary hover:text-primary-dark"
            >
              {showSimplified ? "Simplified" : "All"}
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
                    className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-text-body">{fromName}</span>
                      <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="font-medium text-text-body">{toName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-text-heading">
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
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
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

      {simplified && simplified.length === 0 && Object.keys(balances).length > 0 && (
        <div className="rounded-lg border border-dashed border-divider py-8 text-center">
          <svg className="mx-auto mb-2 h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-text-muted">All settled up!</p>
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

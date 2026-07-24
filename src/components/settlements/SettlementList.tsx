"use client";

import { useState } from "react";
import { useUser } from "@/lib/user-context";
import QrCode from "@/components/ui/QrCode";
import { generateUpiLink } from "@/lib/upi/generate-link";

interface Settlement {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: "pending" | "confirmed" | "disputed";
  note: string;
  created_at: string;
}

interface SettlementListProps {
  settlements: Settlement[];
  loading: boolean;
  error: string;
  groupId: string;
  onRefresh: () => void;
}

const statusConfig = {
  pending: { label: "Pending", dot: "bg-amber-400", bg: "bg-amber-50" },
  confirmed: { label: "Confirmed", dot: "bg-green-500", bg: "bg-green-50" },
  disputed: { label: "Disputed", dot: "bg-red-400", bg: "bg-red-50" },
};

import { formatDate } from '@/lib/constants';


export default function SettlementList({ settlements, loading, error, groupId, onRefresh }: SettlementListProps) {
  const { getUserName, getUserVpa } = useUser();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [qrSettlement, setQrSettlement] = useState<string | null>(null);

  const updateStatus = async (settlementId: string, status: "confirmed" | "disputed") => {
    setActionLoading(settlementId);
    try {
      const res = await fetch(`/api/groups/${groupId}/settlements/${settlementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update settlement");
      }
      onRefresh();
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-secondary" />
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

  if (settlements.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-divider py-12 text-center">
        <p className="text-sm font-medium text-text-body">No settlements yet</p>
        <p className="mt-1 text-xs text-text-muted">They&apos;ll appear once someone settles up</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-text-heading">Settlements</h3>
      <div className="space-y-2">
        {settlements.map((s) => {
          const st = statusConfig[s.status];
          return (
            <div
              key={s.id}
              className={`rounded-xl border bg-surface px-4 py-3 shadow-sm transition-colors ${
                s.status === "confirmed"
                  ? "border-green-200"
                  : s.status === "disputed"
                    ? "border-red-200"
                    : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-[10px] font-bold text-danger">
                      {getUserName(s.from_user).charAt(0).toUpperCase()}
                    </span>
                    <svg className="h-3 w-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-[10px] font-bold text-success">
                      {getUserName(s.to_user).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-body">
                      {getUserName(s.from_user)} → {getUserName(s.to_user)}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                      <span>{formatDate(s.created_at, true)}</span>
                      {s.note && <><span className="text-border">·</span><span className="truncate">{s.note}</span></>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-sm font-semibold text-text-heading tabular-nums">
                    ₹{s.amount.toFixed(2)}
                  </span>
                  <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${st.bg}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </div>
              </div>

              {s.status === "pending" && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {(() => {
                    const vpa = getUserVpa(s.to_user);
                    if (!vpa) return null;
                    return (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const link = generateUpiLink({
                                vpa,
                                amount: s.amount,
                                name: getUserName(s.to_user),
                                note: `Settle: ${getUserName(s.from_user)}`,
                                transactionRef: s.id.slice(0, 35),
                              });
                              window.location.href = link;
                            }}
                            className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
                          >
                            Pay via UPI
                          </button>
                          <button
                            onClick={() => setQrSettlement(qrSettlement === s.id ? null : s.id)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-body transition-colors hover:bg-surface-secondary"
                          >
                            {qrSettlement === s.id ? "Hide QR" : "QR"}
                          </button>
                        </div>
                        {qrSettlement === s.id && (
                          <div className="py-2">
                            <QrCode
                              data={generateUpiLink({
                                vpa,
                                amount: s.amount,
                                name: getUserName(s.to_user),
                                note: `Settle: ${getUserName(s.from_user)}`,
                              })}
                              size={160}
                            />
                            <p className="mt-1 text-center text-[10px] text-text-muted">
                              Scan with any UPI app
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(s.id, "confirmed")}
                      disabled={actionLoading === s.id}
                      className="flex-1 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === s.id ? "..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => updateStatus(s.id, "disputed")}
                      disabled={actionLoading === s.id}
                      className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      Dispute
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

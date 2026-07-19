"use client";

import { useState } from "react";
import { getUserName, getUserVpa } from "@/lib/user-cache";
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
  pending: { label: "Pending", color: "bg-amber-50 text-warning" },
  confirmed: { label: "Confirmed", color: "bg-green-50 text-success" },
  disputed: { label: "Disputed", color: "bg-red-50 text-danger" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function SettlementList({ settlements, loading, error, groupId, onRefresh }: SettlementListProps) {
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
    return <div className="py-8 text-center text-sm text-text-muted">Loading settlements...</div>;
  }

  if (error) {
    return <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>;
  }

  if (settlements.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-divider py-12 text-center">
        <svg className="mx-auto mb-3 h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <p className="text-sm text-text-muted">No settlements yet</p>
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
              className={`rounded-xl border px-4 py-3 shadow-sm ${
                s.status === "pending"
                  ? "border-border bg-surface"
                  : s.status === "confirmed"
                    ? "border-green-200 bg-green-50/40"
                    : "border-red-200 bg-red-50/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-text-heading">
                      {getUserName(s.from_user)}
                    </span>
                    <svg className="h-4 w-4 flex-shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-medium text-text-heading">
                      {getUserName(s.to_user)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                    <span>{formatDate(s.created_at)}</span>
                    {s.note && <><span>·</span><span className="truncate">{s.note}</span></>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm font-semibold text-text-heading">
                    ₹{s.amount.toFixed(2)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              </div>

              {s.status === "pending" && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {/* UPI section — show when current user is the payer */}
                  {(() => {
                    const vpa = getUserVpa(s.to_user);
                    if (!vpa) return null;
                    return (
                      <div className="space-y-2">
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
                          className="w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
                        >
                          Pay via UPI
                        </button>
                        <button
                          onClick={() =>
                            setQrSettlement(
                              qrSettlement === s.id ? null : s.id,
                            )
                          }
                          className="w-full rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-body transition-colors hover:bg-surface-secondary"
                        >
                          {qrSettlement === s.id
                            ? "Hide QR"
                            : "Show QR Code"}
                        </button>
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
                      className="flex-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-red-50 disabled:opacity-50"
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

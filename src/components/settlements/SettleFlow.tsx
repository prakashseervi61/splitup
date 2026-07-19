"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import QrCode from "@/components/ui/QrCode";
import { generateUpiLink } from "@/lib/upi/generate-link";

interface SettleFlowProps {
  open: boolean;
  onClose: () => void;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  vpa: string;
  amount: number;
  groupId: string;
  onComplete: () => void;
}

type Step = "initiate" | "confirm" | "done";

/**
 * Multi-step settle-up modal:
 *   1. Initiate — show amount, parties, Pay via UPI
 *   2. Self-confirm — "I've Paid" → PATCH confirmed
 *   3. Done — show final status
 */
export default function SettleFlow({
  open,
  onClose,
  from,
  to,
  fromName,
  toName,
  vpa,
  amount,
  groupId,
  onComplete,
}: SettleFlowProps) {
  const [step, setStep] = useState<Step>("initiate");
  const [settlementId, setSettlementId] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "confirmed">("pending");
  const [showQr, setShowQr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("initiate");
    setSettlementId(null);
    setStatus("pending");
    setShowQr(false);
    setLoading(false);
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Step 1 — create pending settlement, open UPI link
  const handlePayViaUpi = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_user: from,
          to_user: to,
          amount,
          note: `Settle up: ${fromName} → ${toName}`,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create settlement");
      }
      const settlement = await res.json();
      setSettlementId(settlement.id);

      // Open UPI deep-link
      if (vpa) {
        const link = generateUpiLink({
          vpa,
          amount,
          name: toName,
          note: `Settle: ${fromName}`,
          transactionRef: settlement.id.slice(0, 35),
        });
        window.location.href = link;
      }

      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — confirm payment
  const handleConfirmPayment = async () => {
    if (!settlementId) return;
    if (!window.confirm(`Did you pay ₹${amount.toFixed(2)} to ${toName}?`)) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/groups/${groupId}/settlements/${settlementId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "confirmed" }),
        },
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to confirm settlement");
      }
      setStatus("confirmed");
      setStep("done");
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Settle Up">
      {step === "initiate" && (
        <div className="space-y-5">
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <p className="text-xs text-gray-500">Amount</p>
            <p className="text-3xl font-bold text-gray-900">
              ₹{amount.toFixed(2)}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="font-medium text-gray-700">{fromName}</span>
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
            <span className="font-medium text-gray-700">{toName}</span>
          </div>

          {vpa && (
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-center text-sm">
              <span className="text-gray-500">Pay to VPA: </span>
              <span className="font-mono font-medium text-gray-800">{vpa}</span>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="space-y-2">
            {vpa ? (
              <>
                <button
                  onClick={handlePayViaUpi}
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Pay via UPI"}
                </button>
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {showQr ? "Hide QR Code" : "Show QR Code"}
                </button>
              </>
            ) : (
              <p className="text-center text-sm text-gray-400">
                No UPI ID available for {toName}
              </p>
            )}
          </div>

          {showQr && vpa && (
            <div className="pt-2">
              <QrCode
                data={generateUpiLink({
                  vpa,
                  amount,
                  name: toName,
                  note: `Settle: ${fromName}`,
                })}
                size={180}
              />
              <p className="mt-2 text-center text-xs text-gray-400">
                Scan with any UPI app
              </p>
            </div>
          )}
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-5">
          <div className="rounded-xl bg-blue-50 p-4 text-center">
            <p className="text-xs text-blue-500">Payment Initiated</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              ₹{amount.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {fromName} → {toName}
            </p>
          </div>

          {vpa && (
            <button
              onClick={() => setShowQr(!showQr)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              {showQr ? "Hide QR" : "Show QR Code (scan from another device)"}
            </button>
          )}

          {showQr && vpa && (
            <QrCode
              data={generateUpiLink({
                vpa,
                amount,
                name: toName,
                note: `Settle: ${fromName}`,
              })}
              size={180}
            />
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Confirming..." : "I've Paid"}
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-5 text-center">
          {status === "confirmed" ? (
            <div className="rounded-xl bg-emerald-50 p-6">
              <svg
                className="mx-auto h-12 w-12 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-3 text-lg font-semibold text-emerald-800">
                Payment Confirmed
              </p>
              <p className="mt-1 text-sm text-emerald-600">
                ₹{amount.toFixed(2)} paid to {toName}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 p-6">
              <p className="text-lg font-semibold text-amber-800">
                Payment Pending
              </p>
              <p className="mt-1 text-sm text-amber-600">
                Waiting for confirmation
              </p>
            </div>
          )}

          <button
            onClick={handleClose}
            className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}

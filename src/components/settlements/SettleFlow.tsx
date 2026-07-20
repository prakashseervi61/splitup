"use client";

import { useState, useRef} from "react";
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

  const [counterDisplay, setCounterDisplay] = useState(amount);
  const counterRef = useRef<number>(amount);
  const flashRef = useRef<HTMLDivElement>(null);

  // ponytail: global lock, per-account locks if throughput matters
  const animatingRef = useRef(false);

  const reset = () => {
    setStep("initiate");
    setSettlementId(null);
    setStatus("pending");
    setShowQr(false);
    setLoading(false);
    setError("");
    setCounterDisplay(amount);
    counterRef.current = amount;
    animatingRef.current = false;
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

  // Step 2 — confirm payment with settle ripple animation
  const handleConfirmPayment = async () => {
    if (!settlementId) return;
    if (!window.confirm(`Did you pay ₹${amount.toFixed(2)} to ${toName}?`)) {
      return;
    }

    if (animatingRef.current) return;
    animatingRef.current = true;

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

      // Phase 2: green flash sweep
      if (flashRef.current) {
        flashRef.current.style.transform = "translateX(100%)";
        flashRef.current.style.transition = "transform 0.4s ease-out";
      }

      // Phase 2: counter animation via requestAnimationFrame
      const startVal = amount;
      const duration = 400; // ms
      const startTime = performance.now();

      const animateCounter = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out quad
        const eased = 1 - (1 - progress) * (1 - progress);
        const current = startVal * (1 - eased);
        setCounterDisplay(current);
        counterRef.current = current;

        if (progress < 1) {
          requestAnimationFrame(animateCounter);
        } else {
          setCounterDisplay(0);
          setStep("done");
          onComplete();
          animatingRef.current = false;
        }
      };

      requestAnimationFrame(animateCounter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm");
      animatingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Settle Up">
      {step === "initiate" && (
        <div className="space-y-5">
          <div className="rounded-xl bg-surface-secondary p-4 text-center">
            <p className="text-xs text-text-muted">Amount</p>
            <p className="text-4xl font-bold text-text-heading" style={{ fontVariantNumeric: "tabular-nums" }}>
              ₹{amount.toFixed(2)}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="font-medium text-text-body">{fromName}</span>
            <svg
              className="h-5 w-5 text-text-muted"
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
            <span className="font-medium text-text-body">{toName}</span>
          </div>

          {vpa && (
            <div className="rounded-lg border border-border bg-surface px-4 py-2 text-center text-sm">
              <span className="text-text-muted">Pay to VPA: </span>
              <span className="font-mono font-medium text-text-heading">{vpa}</span>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="space-y-2">
            {vpa ? (
              <>
                <button
                  onClick={handlePayViaUpi}
                  disabled={loading}
                  className="animate-settle-ripple w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Pay via UPI"}
                </button>
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="w-full rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-body transition-colors hover:bg-surface-secondary"
                >
                  {showQr ? "Hide QR Code" : "Show QR Code"}
                </button>
              </>
            ) : (
              <p className="text-center text-sm text-text-muted">
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
              <p className="mt-2 text-center text-xs text-text-muted">
                Scan with any UPI app
              </p>
            </div>
          )}
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-xl bg-primary-subtle p-4 text-center">
            {/* Green flash sweep element */}
            <div
              ref={flashRef}
              className="absolute inset-0 bg-success/15"
              style={{ transform: "translateX(-100%)" }}
            />
            <p className="relative text-xs font-medium text-primary">Payment Initiated</p>
            <p className="relative mt-1 text-xl font-semibold text-text-heading" style={{ fontVariantNumeric: "tabular-nums" }}>
              ₹{counterDisplay.toFixed(2)}
            </p>
            <p className="relative mt-1 text-sm text-text-body">
              {fromName} → {toName}
            </p>
          </div>

          {vpa && (
            <button
              onClick={() => setShowQr(!showQr)}
              className="w-full rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-body transition-colors hover:bg-surface-secondary"
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
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="animate-settle-ripple w-full rounded-xl bg-success px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "✓" : "I've Paid"}
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-5 text-center">
          {status === "confirmed" ? (
            <div className="rounded-xl bg-green-50 p-6">
              <svg
                className="mx-auto h-12 w-12 text-success"
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
              <p className="mt-3 text-lg font-semibold text-success">
                Payment Confirmed
              </p>
              <p className="mt-1 text-sm text-green-600">
                ₹{amount.toFixed(2)} paid to {toName}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 p-6">
              <p className="text-lg font-semibold text-warning">
                Payment Pending
              </p>
              <p className="mt-1 text-sm text-amber-600">
                Waiting for confirmation
              </p>
            </div>
          )}

          <button
            onClick={handleClose}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}

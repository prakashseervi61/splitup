"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  onMemberAdded: () => void;
}

export default function InviteMemberModal({
  open,
  onClose,
  groupId,
  onMemberAdded,
}: InviteMemberModalProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setPhone("");
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim().replace(/\s/g, "");
    if (!trimmed || trimmed.length < 6) {
      setError("Enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, to_phone: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send invite');
        return;
      }

      setSuccess(true);
      onMemberAdded();
      setTimeout(handleClose, 1200);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Invite Member">
      {success ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-subtle">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-text-body">Invite sent!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-text-muted">
            Enter the phone number of the person you want to invite. They&apos;ll receive
            the invite in their inbox.
          </p>

          <div>
            <label
              htmlFor="invite-phone"
              className="mb-1 block text-xs font-medium text-text-muted"
            >
              Phone Number
            </label>
            <div className="flex items-center gap-0 rounded-xl border border-border bg-surface-secondary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <span className="pl-3 pr-2 text-sm font-medium text-text-muted select-none">
                +91
              </span>
              <input
                id="invite-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                className="flex-1 bg-transparent py-2.5 pr-3 pl-1 text-sm text-text-body placeholder:text-text-muted focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark active:bg-primary-active disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Sending...
              </span>
            ) : (
              "Send Invite"
            )}
          </button>
        </form>
      )}
    </Modal>
  );
}

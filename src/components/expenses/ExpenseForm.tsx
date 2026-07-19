"use client";

import { useState, FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { getUserName } from "@/lib/user-cache";

interface Member {
  user_id: string;
}

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  members: Member[];
  onCreated: () => void;
}

type SplitMethod = "equal" | "custom" | "percentage";

const CATEGORIES = [
  "Food",
  "Rent",
  "Groceries",
  "Utilities",
  "Transport",
  "Shopping",
  "Entertainment",
  "Other",
];

export default function ExpenseForm({ open, onClose, groupId, members, onCreated }: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [paidBy, setPaidBy] = useState("user-1");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    members.forEach((m) => { init[m.user_id] = true; });
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const selectedUserIds = members
    .map((m) => m.user_id)
    .filter((id) => selectedMembers[id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description.trim()) { setError("Description is required"); return; }
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount"); return; }

    let split_data: Record<string, number> | undefined;

    if (splitMethod === "custom") {
      split_data = {};
      for (const uid of selectedUserIds) {
        const val = parseFloat(customShares[uid] || "0");
        if (isNaN(val) || val < 0) { setError(`Invalid share for ${getUserName(uid)}`); return; }
        split_data[uid] = val;
      }
      const total = Object.values(split_data).reduce((s, v) => s + v, 0);
      if (Math.abs(total - amt) > 0.01) {
        setError(`Shares (${total.toFixed(2)}) must equal amount (${amt.toFixed(2)})`);
        return;
      }
    } else if (splitMethod === "percentage") {
      split_data = {};
      for (const uid of selectedUserIds) {
        const val = parseFloat(percentages[uid] || "0");
        if (isNaN(val) || val < 0 || val > 100) { setError(`Invalid percentage for ${getUserName(uid)}`); return; }
        split_data[uid] = val;
      }
      const totalPct = Object.values(split_data).reduce((s, v) => s + v, 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        setError(`Percentages must sum to 100 (got ${totalPct})`);
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        paid_by: paidBy,
        amount: amt,
        description: description.trim(),
        category,
        split_method: splitMethod,
      };
      if (splitMethod === "equal") {
        body.split_data = undefined;
      } else if (split_data) {
        body.split_data = split_data;
      }

      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create expense"); return; }

      setDescription("");
      setAmount("");
      setCategory("Food");
      setPaidBy("user-1");
      setSplitMethod("equal");
      setCustomShares({});
      setPercentages({});
      onClose();
      onCreated();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Dinner at Pind"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Paid By */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Paid By</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {getUserName(m.user_id)}
              </option>
            ))}
          </select>
        </div>

        {/* Split Method */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Split Method</label>
          <div className="flex gap-2">
            {(["equal", "custom", "percentage"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSplitMethod(m)}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  splitMethod === m
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Members with split inputs */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Split Among
          </label>
          <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2">
            {members.map((m) => {
              const name = getUserName(m.user_id);
              const selected = selectedMembers[m.user_id];
              return (
                <label
                  key={m.user_id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    selected ? "bg-indigo-50" : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleMember(m.user_id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex-1 font-medium text-gray-700">{name}</span>
                  {splitMethod === "custom" && selected && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customShares[m.user_id] ?? ""}
                        onChange={(e) =>
                          setCustomShares((p) => ({ ...p, [m.user_id]: e.target.value }))
                        }
                        placeholder="0"
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                  {splitMethod === "percentage" && selected && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={percentages[m.user_id] ?? ""}
                        onChange={(e) =>
                          setPercentages((p) => ({ ...p, [m.user_id]: e.target.value }))
                        }
                        placeholder="0"
                        className="w-16 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

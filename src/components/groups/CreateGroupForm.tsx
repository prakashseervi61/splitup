"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { useUser } from "@/lib/user-context";

interface CreateGroupFormProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export default function CreateGroupForm({ open, onClose, userId }: CreateGroupFormProps) {
  const router = useRouter();
  const { cacheUsers } = useUser();
  const [name, setName] = useState("");
  const [type, setType] = useState<"pg" | "hostel" | "trip">("pg");
  const [newMemberName, setNewMemberName] = useState("");
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addMember = () => {
    const trimmed = newMemberName.trim();
    if (trimmed && !memberNames.includes(trimmed)) {
      setMemberNames([...memberNames, trimmed]);
    }
    setNewMemberName("");
  };

  const removeMember = (name: string) => {
    setMemberNames(memberNames.filter((n) => n !== name));
  };

  const reset = () => {
    setName("");
    setType("pg");
    setMemberNames([]);
    setNewMemberName("");
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Group name is required"); return; }
    if (type !== "pg" && type !== "hostel" && type !== "trip") { setError("Select a group type"); return; }

    setSubmitting(true);
    setError("");

    try {
      const newMembers = memberNames.map((n) => ({
        name: n,
        phone: `+91-${n.toLowerCase().replace(/\s+/g, "")}@splitup`,
      }));

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          created_by: userId,
          newMembers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create group");
        return;
      }

      const allIds = (data.members as { user_id: string }[]).map((m) => m.user_id);
      if (allIds.length > 0) {
        fetch(`/api/users/batch?ids=${allIds.join(',')}`)
          .then((r) => r.ok ? r.json() : null)
          .then((userMap) => { if (userMap) cacheUsers(userMap); })
          .catch(() => {});
      }

      reset();
      onClose();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Group">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-body">
            Group Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sunshine PG"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-body">
            Group Type
          </label>
          <div className="flex gap-2">
            {(["pg", "hostel", "trip"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                  type === t
                    ? "border-primary bg-primary-subtle text-primary"
                    : "border-border text-text-body hover:border-divider"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-body">
            Members
          </label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary">
              You
            </span>
            {memberNames.map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-body"
              >
                {n}
                <button type="button" onClick={() => removeMember(n)} className="text-text-muted hover:text-text-body">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }}
              placeholder="Enter member name"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={addMember}
              disabled={!newMemberName.trim()}
              className="rounded-lg border border-border px-3 py-2.5 text-sm text-text-body transition-colors hover:bg-surface-secondary disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => { reset(); onClose(); }}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-body transition-colors hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Group"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

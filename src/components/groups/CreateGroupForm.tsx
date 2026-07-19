"use client";

import { useState, FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { setUserName, getUserName } from "@/lib/user-cache";

interface CreateGroupFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateGroupForm({ open, onClose, onCreated }: CreateGroupFormProps) {
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
      // ponytail: deterministic phone from name so the same person reuses the same user record
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
          created_by: "user-1",
          newMembers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create group");
        return;
      }

      // Cache user names for new members
      const knownIds = new Set(["user-1"]);
      for (const m of data.members as { user_id: string }[]) {
        if (!knownIds.has(m.user_id)) {
          knownIds.add(m.user_id);
        }
      }

      // Assign names to new user IDs (skip known ones)
      const newUserIds = (data.members as { user_id: string }[])
        .map((m) => m.user_id)
        .filter((id) => id !== "user-1");

      newUserIds.forEach((id: string, i: number) => {
        if (memberNames[i]) setUserName(id, memberNames[i]);
      });

      reset();
      onClose();
      onCreated();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Group">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Group Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Group Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sunshine PG"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Group Type */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Group Type
          </label>
          <div className="flex gap-2">
            {(["pg", "hostel", "trip"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  type === t
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Members */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Members
          </label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
              You
            </span>
            {memberNames.map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
              >
                {n}
                <button type="button" onClick={() => removeMember(n)} className="text-gray-400 hover:text-gray-600">
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
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addMember}
              disabled={!newMemberName.trim()}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
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
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Group"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

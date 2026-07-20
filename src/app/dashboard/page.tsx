"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import GroupCard from "@/components/groups/GroupCard";
import CreateGroupForm from "@/components/groups/CreateGroupForm";

interface GroupMember {
  user_id: string;
}

interface Group {
  id: string;
  name: string;
  type: "pg" | "hostel" | "trip";
  members: GroupMember[];
}

export default function DashboardPage() {
  const { ensureUsers } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  const fetchGroups = async (userId: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/groups?userId=${userId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch groups");
      }
      const data = await res.json();
      setGroups(data);
      const allIds = data.flatMap((g: Group) => g.members.map((m: { user_id: string }) => m.user_id));
      if (allIds.length > 0) ensureUsers(allIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (user) {
          setCurrentUser(user);
          fetchGroups(user.id);
        } else {
          setError("Not authenticated");
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Failed to get current user");
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-heading">Your Groups</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage expenses, track balances, and settle up with one tap.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <button onClick={() => currentUser && fetchGroups(currentUser.id)} className="ml-2 font-medium underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-border bg-surface-secondary"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-divider py-20 text-center">
            <h2 className="text-lg font-semibold text-text-body">No groups yet</h2>
            <p className="mt-1 text-sm text-text-muted">
              Create a group to start splitting expenses
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <GroupCard
                key={g.id}
                id={g.id}
                name={g.name}
                type={g.type}
                memberCount={g.members.length}
              />
            ))}

            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center justify-center rounded-xl border-2 border-dashed border-border p-5 text-sm font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Create Group</span>
              </div>
            </button>
          </div>
        )}

        {groups.length > 0 && (
          <button
            onClick={() => setShowCreate(true)}
            className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary-dark sm:hidden"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        )}
      </div>

      <CreateGroupForm
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => currentUser && fetchGroups(currentUser.id)}
        userId={currentUser?.id ?? ""}
      />
    </div>
  );
}

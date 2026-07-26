'use client';

import { useState } from 'react';
import GroupCard from './GroupCard';
import CreateGroupForm from './CreateGroupForm';

interface GroupMember {
  user_id: string;
}

interface Group {
  id: string;
  name: string;
  type: 'pg' | 'hostel' | 'trip';
  members: GroupMember[];
}

interface GroupListProps {
  groups: Group[];
  userId: string;
}

export default function GroupList({ groups, userId }: GroupListProps) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 pb-24 sm:pb-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-heading" data-walkthrough="groups">Your Groups</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage expenses, track balances, and settle up with one tap.
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-divider py-20 text-center">
            <h2 className="text-lg font-semibold text-text-body">No groups yet</h2>
            <p className="mt-1 text-sm text-text-muted">
              Create a group to start splitting expenses
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
              data-walkthrough="create-group"
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
              data-walkthrough="create-group"
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
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
            aria-label="Create group"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        )}
      </div>

      <CreateGroupForm
        open={showCreate}
        onClose={() => setShowCreate(false)}
        userId={userId}
      />
    </div>
  );
}

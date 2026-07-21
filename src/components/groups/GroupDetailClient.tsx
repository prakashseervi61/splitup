'use client';

import { useState, useEffect, useOptimistic, startTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/user-context';
import GroupTabs from './GroupTabs';
import InviteMemberModal from './InviteMemberModal';
import SettleFlow from '@/components/settlements/SettleFlow';

interface ExpenseSplit {
  user_id: string;
  share_amount: number;
}

interface Expense {
  id: string;
  paid_by: string;
  amount: number;
  description: string;
  category: string;
  created_at: string;
  splits: ExpenseSplit[];
}

interface Settlement {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'disputed';
  note: string;
  created_at: string;
}

interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
}

interface GroupMember {
  user_id: string;
  joined_at: string;
}

interface GroupData {
  id: string;
  name: string;
  type: 'pg' | 'hostel' | 'trip';
  members: GroupMember[];
  balances: Record<string, number>;
  created_by: string;
}

interface GroupDetailClientProps {
  group: GroupData;
  expenses: Expense[];
  balances: Record<string, number>;
  simplified: SimplifiedDebt[] | null;
  settlements: Settlement[];
  userId: string;  users?: Record<string, { id: string; name: string; phone: string; default_vpa: string }>;
}

const typeConfig = {
  pg: { label: 'PG', color: 'bg-primary-subtle text-primary' },
  hostel: { label: 'Hostel', color: 'bg-amber-50 text-warning' },
  trip: { label: 'Trip', color: 'bg-green-50 text-success' },
};

export default function GroupDetailClient({
    users = {},
  group,
  expenses,
  balances,
  simplified,
  settlements,
  userId,
}: GroupDetailClientProps) {
  const router = useRouter();
  const { getUserName, getUserVpa, cacheUsers } = useUser();
  const [showInvite, setShowInvite] = useState(false);
  const [settleTarget, setSettleTarget] = useState<{
    from: string;
    to: string;
    amount: number;
  } | null>(null);
  const [currentBalances, setCurrentBalances] = useState(balances);
  const [currentSimplified, setCurrentSimplified] = useState(simplified);
  const [currentSettlements, setCurrentSettlements] = useState(settlements);

  const [showMenu, setShowMenu] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [renameValue, setRenameValue] = useState(group.name);
  const [renameError, setRenameError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [optimisticName, setOptimisticName] = useOptimistic(
    group.name,
    (_state: string, newName: string) => newName,
  );

  const isCreator = userId === group.created_by;

  const t = typeConfig[group.type];
  const members = group.members || [];

  const userBalance = currentBalances[userId] ?? 0;
  const userDebts = currentSimplified?.filter((d) => d.from === userId) ?? [];
  const userReceivables = currentSimplified?.filter((d) => d.to === userId) ?? [];
  const hasUserDebts = userDebts.length > 0;
  const totalUserOwed = userReceivables.reduce((s, d) => s + d.amount, 0);
  const totalUserOwes = userDebts.reduce((s, d) => s + d.amount, 0);

  useEffect(() => {
    if (Object.keys(users).length > 0) {
      cacheUsers(users);
    }
  }, [users, cacheUsers]);

  const refreshData = async () => {
    const [balRes, settRes] = await Promise.all([
      fetch(`/api/groups/${group.id}/balances?simplified=true`),
      fetch(`/api/groups/${group.id}/settlements`),
    ]);
    if (balRes.ok) {
      const balData = await balRes.json();
      setCurrentBalances(balData.balances);
      setCurrentSimplified(balData.simplified ?? null);
    }
    if (settRes.ok) {
      const settData = await settRes.json();
      setCurrentSettlements(settData);
    }
    router.refresh();
  };

  const handleSettleAll = () => {
    if (userDebts.length > 0) {
      const first = userDebts[0];
      setSettleTarget({
        from: first.from,
        to: first.to,
        amount: first.amount,
      });
    }
  };

  const handleRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError('Group name cannot be empty.');
      return;
    }
    if (trimmed.length > 50) {
      setRenameError('Group name must be 50 characters or fewer.');
      return;
    }
    setRenameError('');
    setOptimisticName(trimmed);
    const res = await fetch(`/api/groups/${group.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) {
      setOptimisticName(group.name);
      const err = await res.json();
      setRenameError(err.error || 'Failed to rename group.');
    } else {
      router.refresh();
      setShowRename(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError('');
    setIsDeleting(true);
    const res = await fetch(`/api/groups/${group.id}`, { method: 'DELETE' });
    setIsDeleting(false);
    if (!res.ok) {
      const err = await res.json();
      setDeleteError(err.error || 'Failed to delete group.');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 py-2 text-sm text-text-muted hover:text-text-body"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      {/* Group Header */}
      <div className="mb-6">
        <div className="relative flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-heading">{optimisticName}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${t.color}`}>
            {t.label}
          </span>
          <div className="relative ml-auto">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-body"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-white shadow-lg">
                {isCreator && (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setRenameValue(group.name);
                        setRenameError('');
                        setShowRename(true);
                      }}
                      className="w-full rounded-t-lg px-4 py-2.5 text-left text-sm text-text-body hover:bg-surface-secondary"
                    >
                      Rename group
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setDeleteError('');
                        setShowDelete(true);
                      }}
                      className="w-full rounded-b-lg px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete group
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {members.map((m) => (
            <span
              key={m.user_id}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-body"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-bold text-primary">
                {getUserName(m.user_id).charAt(0).toUpperCase()}
              </span>
              {getUserName(m.user_id)}
            </span>
          ))}
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Invite
          </button>
        </div>
      </div>

      {/* Balance Overview Banner */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Your Balance
            </p>
            <p
              className="mt-0.5 text-2xl font-bold tabular-nums"
              style={{
                color:
                  userBalance > 0
                    ? '#15803D'
                    : userBalance < 0
                      ? '#B91C1C'
                      : '#9CA3AF',
              }}
            >
              {userBalance > 0 ? '+' : ''}₹{Math.abs(userBalance).toFixed(2)}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {userBalance > 0
                ? `${totalUserOwed > 0 ? `You are owed ₹${totalUserOwed.toFixed(2)}` : 'You are owed money'}`
                : userBalance < 0
                  ? `${hasUserDebts ? `You owe ₹${totalUserOwes.toFixed(2)}` : 'You owe money'}`
                  : 'All settled up'}
            </p>
          </div>
          {hasUserDebts && (
            <button
              onClick={handleSettleAll}
              className="animate-settle-ripple rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark active:bg-primary-active"
            >
              Settle Now
            </button>
          )}
          {userBalance > 0 && totalUserOwed === 0 && !hasUserDebts && (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-success">
              All clear
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <GroupTabs
        expenses={expenses}
        balances={currentBalances}
        simplified={currentSimplified}
        settlements={currentSettlements}
        groupId={group.id}
        members={members}
        userId={userId}
        onRefresh={refreshData}
      />

      {/* Settle Flow Modal */}
      {settleTarget && (
        <SettleFlow
          open={!!settleTarget}
          onClose={() => setSettleTarget(null)}
          from={settleTarget.from}
          fromName={getUserName(settleTarget.from)}
          to={settleTarget.to}
          toName={getUserName(settleTarget.to)}
          vpa={getUserVpa(settleTarget.to)}
          amount={settleTarget.amount}
          groupId={group.id}
          onComplete={() => {
            setSettleTarget(null);
            refreshData();
          }}
        />
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        groupId={group.id}
        onMemberAdded={refreshData}
      />

      {/* Rename Modal */}
      {showRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-text-heading">Rename group</h2>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
              maxLength={50}
              className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-body outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {renameError && (
              <p className="mt-1.5 text-xs text-red-600">{renameError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowRename(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-text-heading">Delete group?</h2>
            <p className="mt-2 text-sm text-text-muted">
              <span className="font-medium text-text-body">{optimisticName}</span> will be permanently deleted. This cannot be undone.
            </p>
            {deleteError && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{deleteError}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click-away handler for three-dot menu */}
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
}

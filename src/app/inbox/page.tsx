'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface EnrichedInvite {
  id: string;
  group_id: string;
  from_user_id: string;
  to_phone: string;
  to_user_id: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  group_name: string;
  from_user_name: string;
}

type Tab = 'received' | 'sent';

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-50 text-warning',
  accepted: 'bg-green-50 text-success',
  rejected: 'bg-red-50 text-danger',
};

export default function InboxPage() {
  const [tab, setTab] = useState<Tab>('received');
  const [received, setReceived] = useState<EnrichedInvite[]>([]);
  const [sent, setSent] = useState<EnrichedInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [recvRes, sentRes] = await Promise.all([
        fetch('/api/invites?type=received'),
        fetch('/api/invites?type=sent'),
      ]);

      if (recvRes.ok) {
        const data = await recvRes.json();
        setReceived(data);
      }
      if (sentRes.ok) {
        const data = await sentRes.json();
        setSent(data);
      }
    } catch {
      setError('Failed to load invites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInvites();
  }, [fetchInvites]);

  const handleAction = async (inviteId: string, action: 'accept' | 'reject') => {
    setActionLoading(inviteId);
    try {
      const res = await fetch(`/api/invites/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update invite');
        return;
      }

      setReceived((prev) =>
        prev.map((inv) =>
          inv.id === inviteId ? { ...inv, status: action === 'accept' ? 'accepted' : 'rejected' } : inv,
        ),
      );
    } catch {
      setError('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingReceived = received.filter((i) => i.status === 'pending');
  const processedReceived = received.filter((i) => i.status !== 'pending');

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

      <h1 className="mb-6 text-2xl font-bold text-text-heading">Inbox</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-6 border-b border-border">
        <button
          onClick={() => setTab('received')}
          className={`border-b-2 pb-3 pt-2 text-sm font-medium transition-colors ${
            tab === 'received'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-body'
          }`}
        >
          Received
          {pendingReceived.length > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {pendingReceived.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`border-b-2 pb-3 pt-2 text-sm font-medium transition-colors ${
            tab === 'sent'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-body'
          }`}
        >
          Sent
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-surface-secondary" />
          ))}
        </div>
      ) : tab === 'received' ? (
        <div className="space-y-6">
          {pendingReceived.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                Pending
              </h2>
              <div className="space-y-3">
                {pendingReceived.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-heading">
                          You&apos;ve been invited to{' '}
                          <span className="text-primary">{invite.group_name}</span>
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          by {invite.from_user_name}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-warning">
                        Pending
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleAction(invite.id, 'accept')}
                        disabled={actionLoading === invite.id}
                        className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionLoading === invite.id ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleAction(invite.id, 'reject')}
                        disabled={actionLoading === invite.id}
                        className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-text-body transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {processedReceived.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                Earlier
              </h2>
              <div className="space-y-3">
                {processedReceived.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-xl border border-border bg-surface p-4 opacity-70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-heading">
                          <span className="text-primary">{invite.group_name}</span>
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          by {invite.from_user_name}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusBadge[invite.status]}`}
                      >
                        {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {received.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-divider py-16 text-center">
              <svg className="mb-3 h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <p className="text-sm font-medium text-text-body">No invites yet</p>
              <p className="mt-1 text-xs text-text-muted">
                Invites from group members will appear here
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Sent tab */
        <div className="space-y-3">
          {sent.length > 0 ? (
            sent.map((invite) => (
              <div
                key={invite.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-heading">
                      Invite to <span className="text-primary">{invite.group_name}</span>
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Sent to {invite.to_phone}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusBadge[invite.status]}`}
                  >
                    {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-divider py-16 text-center">
              <svg className="mb-3 h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <p className="text-sm font-medium text-text-body">No sent invites</p>
              <p className="mt-1 text-xs text-text-muted">
                Invite members from any group page
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

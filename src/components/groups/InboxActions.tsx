'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

interface Group {
  id: string;
  name: string;
}

interface InboxActionsProps {
  received: EnrichedInvite[];
  sent: EnrichedInvite[];
  groups: Group[];
}

type Tab = 'received' | 'sent';

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-50 text-warning',
  accepted: 'bg-green-50 text-success',
  rejected: 'bg-red-50 text-danger',
};

export default function InboxActions({ received, sent, groups }: InboxActionsProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('received');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [invitePhone, setInvitePhone] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const pendingReceived = received.filter((i) => i.status === 'pending');
  const processedReceived = received.filter((i) => i.status !== 'pending');

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
        alert(data.error || 'Failed to update invite');
        return;
      }

      router.refresh();
    } catch {
      alert('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvite = async () => {
    setSendingInvite(true);
    setInviteError('');
    setInviteSuccess(false);
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: selectedGroup, to_phone: `+91${invitePhone}` }),
      });
      if (!res.ok) {
        const data = await res.json();
        setInviteError(data.error || 'Failed to send invite');
        return;
      }
      setInviteSuccess(true);
      setInvitePhone('');
      setSelectedGroup('');
      router.refresh();
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch {
      setInviteError('Network error');
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <>
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

      {tab === 'received' ? (
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
                        className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionLoading === invite.id ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleAction(invite.id, 'reject')}
                        disabled={actionLoading === invite.id}
                        className="rounded-lg border border-border px-4 py-2.5 text-xs font-medium text-text-body transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
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
            <p className="py-16 text-center text-sm text-text-muted">
              No invitations received
            </p>
          )}
        </div>
      ) : (
        /* Sent tab */
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-heading">Send an Invite</h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-border bg-surface-secondary px-3 text-sm text-text-muted">
                  +91
                </span>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Phone number"
                  className="block w-full rounded-r-lg border border-border px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Select a group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button
                onClick={handleSendInvite}
                disabled={sendingInvite || !invitePhone || invitePhone.length !== 10 || !selectedGroup}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingInvite ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
            {inviteError && (
              <p className="mt-2 text-xs text-red-600">{inviteError}</p>
            )}
            {inviteSuccess && (
              <p className="mt-2 text-xs text-success">Invite sent successfully!</p>
            )}
          </div>

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
            <p className="py-16 text-center text-sm text-text-muted">
              No invitations sent yet
            </p>
          )}
        </div>
      )}
    </>
  );
}

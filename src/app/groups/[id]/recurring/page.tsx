'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RecurringForm from '@/components/expenses/RecurringForm';

interface Template {
  id: string;
  group_id: string;
  created_by: string;
  description: string;
  amount: number;
  category: string;
  split_type: string;
  day_of_month: number;
  is_active: boolean;
  next_due: string | null;
  created_at: string;
}

export default function RecurringPage() {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [triggering, setTriggering] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/recurring`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u) setUserId(u.id);
        else router.push('/login');
      });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTemplates();
    // Get member count
    fetch(`/api/groups/${groupId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((g) => { if (g) setMemberCount(g.members?.length || 0); });
  }, [groupId, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleActive = async (template: Template) => {
    try {
      await fetch(`/api/groups/${groupId}/recurring/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !template.is_active }),
      });
      fetchTemplates();
    } catch {
      setError('Failed to update template');
    }
  };

  const handleTrigger = async (templateId: string) => {
    if (!userId) return;
    // confirmation handled by inline UI
    setTriggering(templateId);
    try {
      const res = await fetch(`/api/groups/${groupId}/recurring/${templateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid_by: userId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed');
      }
      // success handled by fetchTemplates refresh
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense');
    } finally {
      setTriggering(null);
    }
  };

  const handleDelete = async (templateId: string) => {
    // confirmation handled by inline UI
    try {
      await fetch(`/api/groups/${groupId}/recurring/${templateId}`, { method: 'DELETE' });
      fetchTemplates();
    } catch {
      alert('Failed to delete');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href={`/groups/${groupId}`}
        className="mb-4 inline-flex items-center gap-1 py-2 text-sm text-text-muted hover:text-text-body"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Group
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Recurring Expenses</h1>
          <p className="mt-1 text-sm text-text-muted">Monthly bills that repeat — set once, trigger anytime.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          + Add
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-surface-secondary" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-divider py-16 text-center">
          <p className="text-sm font-medium text-text-body">No recurring expenses set up</p>
          <p className="mt-1 text-sm text-text-muted">
            Set up monthly bills like rent, wifi, or maid — create them with one tap each month.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            Add Recurring Expense
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`rounded-xl border bg-surface p-4 shadow-sm transition-opacity ${
                t.is_active ? 'border-border' : 'border-border/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-text-heading">{t.description}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-[11px] font-medium text-primary">
                      {t.category}
                    </span>
                    <span>Day {t.day_of_month}</span>
                    <span>·</span>
                    <span className="capitalize">{t.split_type} split</span>
                    {!t.is_active && <span className="text-warning">· Paused</span>}
                  </div>
                </div>
                <span className="ml-3 text-sm font-semibold text-text-heading">₹{t.amount.toFixed(2)}</span>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <button
                  onClick={() => handleTrigger(t.id)}
                  disabled={triggering === t.id || !t.is_active}
                  className="rounded-lg bg-primary px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
                >
                  {triggering === t.id ? '...' : 'Trigger Now'}
                </button>
                <button
                  onClick={() => toggleActive(t)}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                    t.is_active
                      ? 'border-border text-text-body hover:bg-surface-secondary'
                      : 'border-success/30 text-success hover:bg-green-50'
                  }`}
                >
                  {t.is_active ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="ml-auto rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-text-muted transition-colors hover:border-red-200 hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RecurringForm
        open={showForm}
        onClose={() => setShowForm(false)}
        groupId={groupId}
        onCreated={fetchTemplates}
        userId={userId}
        memberCount={memberCount}
      />
    </div>
  );
}

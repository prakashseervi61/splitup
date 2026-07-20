'use client';

import { useState, FormEvent } from 'react';
import Modal from '@/components/ui/Modal';

interface RecurringFormProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  onCreated: () => void;
  userId: string;
  memberCount: number;
}

export default function RecurringForm({ open, onClose, groupId, onCreated, userId, memberCount }: RecurringFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [splitType, setSplitType] = useState<'equal' | 'custom' | 'percentage'>('equal');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Food', 'Rent', 'Groceries', 'Utilities', 'Transport', 'Shopping', 'Entertainment', 'Other'];

  const reset = () => {
    setDescription('');
    setAmount('');
    setCategory('Other');
    setSplitType('equal');
    setDayOfMonth('1');
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { setError('Description is required'); return; }
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) { setError('Amount must be positive'); return; }
    const dom = Number.parseInt(dayOfMonth, 10);
    if (dom < 1 || dom > 31) { setError('Day of month must be 1–31'); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/groups/${groupId}/recurring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          created_by: userId,
          description: description.trim(),
          amount: amt,
          category,
          split_type: splitType,
          split_data: {},
          day_of_month: dom,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create template');
      }
      reset();
      onClose();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Recurring Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-body">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Monthly Rent"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-body">Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-body">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  category === cat
                    ? 'bg-primary text-white'
                    : 'bg-surface-secondary text-text-body hover:bg-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-body">Split Type</label>
          <div className="flex gap-2">
            {(['equal', 'custom', 'percentage'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSplitType(t)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  splitType === t
                    ? 'border-primary bg-primary-subtle text-primary'
                    : 'border-border text-text-body hover:border-divider'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {splitType === 'equal' ? `Splits equally among ${memberCount} members. For custom/percentage splits, create the first expense with the split details — the template will reuse the same split.` : 'Configure the split when creating the expense from this template.'}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-body">Day of Month</label>
          <input
            type="number"
            min="1"
            max="31"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            className="w-24 rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => { reset(); onClose(); }}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-body transition-colors hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Template'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

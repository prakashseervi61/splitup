export const STORAGE_KEYS = {
  WALKTHROUGH_CREATE_DONE: 'splitup_walkthrough_create_done',
  ONBOARDING_COMPLETED: 'splitup_onboarding_completed',
} as const;

export const typeConfig: Record<string, { label: string; color: string }> = {
  pg: { label: 'PG', color: 'bg-primary-subtle text-primary' },
  hostel: { label: 'Hostel', color: 'bg-amber-50 text-warning' },
  trip: { label: 'Trip', color: 'bg-green-50 text-success' },
};

export const CATEGORIES = [
  'Food',
  'Rent',
  'Groceries',
  'Utilities',
  'Transport',
  'Shopping',
  'Entertainment',
  'Other',
] as const;

export const categoryDots: Record<string, string> = {
  Food: 'bg-orange-400',
  Rent: 'bg-violet-400',
  Groceries: 'bg-lime-500',
  Utilities: 'bg-cyan-400',
  Transport: 'bg-yellow-500',
  Shopping: 'bg-pink-400',
  Entertainment: 'bg-purple-400',
  Other: 'bg-gray-400',
};

export function formatDate(iso: string, includeYear = false) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}

export function formatDateGroup(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

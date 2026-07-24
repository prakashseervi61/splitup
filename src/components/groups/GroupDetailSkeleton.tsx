export default function GroupDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-4 h-5 w-20 animate-pulse rounded bg-surface-secondary" />
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-secondary" />
          <div className="h-6 w-12 animate-pulse rounded-full bg-surface-secondary" />
        </div>
        <div className="mt-4 flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-surface-secondary" />
          ))}
        </div>
      </div>
      <div className="mb-6 h-24 animate-pulse rounded-xl border border-border bg-surface-secondary" />
      <div className="mb-6 flex gap-6 border-b border-border">
        {['Expenses', 'Balances', 'Settlements'].map((t) => (
          <div key={t} className="h-10 w-20 animate-pulse bg-surface-secondary" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-2 h-16 animate-pulse rounded-xl bg-surface-secondary" />
      ))}
    </div>
  );
}

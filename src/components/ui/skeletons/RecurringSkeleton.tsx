export default function RecurringSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-2 h-8 w-48 animate-pulse rounded bg-surface-secondary" />
          <div className="h-4 w-64 animate-pulse rounded bg-surface-secondary" />
        </div>
        <div className="h-10 w-20 animate-pulse rounded-lg bg-surface-secondary" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-secondary" />
        ))}
      </div>
    </div>
  );
}

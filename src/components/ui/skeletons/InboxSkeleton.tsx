export default function InboxSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6 h-8 w-32 animate-pulse rounded bg-surface-secondary" />
      <div className="mb-6 flex gap-6 border-b border-border">
        <div className="h-10 w-20 animate-pulse rounded bg-surface-secondary" />
        <div className="h-10 w-16 animate-pulse rounded bg-surface-secondary" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-secondary" />
        ))}
      </div>
    </div>
  );
}

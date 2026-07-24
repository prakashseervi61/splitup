export default function DashboardSkeleton() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-secondary" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-surface-secondary" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-border bg-surface-secondary" />
          ))}
        </div>
      </div>
    </div>
  );
}

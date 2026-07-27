export default function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-surface-secondary" />
        <div className="mx-auto mt-3 h-6 w-40 animate-pulse rounded bg-surface-secondary" />
        <div className="mx-auto mt-2 h-4 w-28 animate-pulse rounded bg-surface-secondary" />
      </div>

      <div className="space-y-5 rounded-xl border border-border bg-surface p-6">
        <div className="space-y-1">
          <div className="h-4 w-12 animate-pulse rounded bg-surface-secondary" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-surface-secondary" />
        </div>
        <div className="space-y-1">
          <div className="h-4 w-24 animate-pulse rounded bg-surface-secondary" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-surface-secondary" />
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface-secondary" />
      </div>

      <div className="mx-auto mt-6 h-10 w-full animate-pulse rounded-lg border border-border bg-surface-secondary" />

      <p className="mt-8 text-center text-xs text-text-muted">Splitup v0.1.0</p>
    </div>
  );
}

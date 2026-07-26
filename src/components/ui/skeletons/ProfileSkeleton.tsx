export default function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <div className="mb-6 h-8 w-24 animate-pulse rounded bg-surface-secondary" />
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-surface-secondary" />
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-surface-secondary" />
            <div className="h-4 w-24 animate-pulse rounded bg-surface-secondary" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-10 w-full animate-pulse rounded-lg bg-surface-secondary" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-surface-secondary" />
        </div>
      </div>
    </div>
  );
}

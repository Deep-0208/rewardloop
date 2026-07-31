import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard loading skeleton.
 *
 * Mirrors the actual dashboard layout to prevent blank screens during data fetch.
 */
export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col pb-28" role="status" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-4 w-28 mb-2 rounded" />
            <Skeleton className="h-7 w-40 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </header>

      {/* KPI Grid skeleton */}
      <section className="px-5 mt-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
      </section>

      {/* Summary row skeleton */}
      <section className="px-5 mt-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
      </section>

      {/* Recent transactions skeleton */}
      <section className="px-5 mt-6">
        <Skeleton className="h-4 w-36 mb-3 rounded" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </section>

      <span className="sr-only">Loading…</span>
    </div>
  );
}

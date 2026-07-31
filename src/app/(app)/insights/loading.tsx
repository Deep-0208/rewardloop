import { Skeleton } from "@/components/ui/skeleton";

/**
 * Insights loading skeleton.
 *
 * Mirrors the insights page layout: header, stat grid, and list sections.
 */
export default function InsightsLoading() {
  return (
    <main
      className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-6 pb-28"
      role="status"
      aria-label="Loading insights"
    >
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-24 rounded-lg" />
        <Skeleton className="h-4 w-36 mt-1.5 rounded" />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>

      {/* Rewards grid */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>

      {/* Top Items section */}
      <div>
        <Skeleton className="h-5 w-28 mb-1 rounded" />
        <Skeleton className="h-3 w-44 mb-3 rounded" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>

      {/* Top Customers section */}
      <div>
        <Skeleton className="h-5 w-32 mb-1 rounded" />
        <Skeleton className="h-3 w-40 mb-3 rounded" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </main>
  );
}

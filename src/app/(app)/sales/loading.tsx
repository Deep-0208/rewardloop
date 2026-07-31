import { Skeleton } from "@/components/ui/skeleton";

/**
 * Transactions loading skeleton.
 *
 * Mirrors the transaction list layout with header and row skeletons.
 */
export default function TransactionsLoading() {
  return (
    <main
      className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-6 pb-28"
      role="status"
      aria-label="Loading transactions"
    >
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-32 rounded-lg" />
        <Skeleton className="h-4 w-24 mt-1.5 rounded" />
      </div>

      {/* Transaction rows */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>

      <span className="sr-only">Loading…</span>
    </main>
  );
}

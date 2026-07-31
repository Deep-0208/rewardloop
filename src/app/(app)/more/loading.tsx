import { Skeleton } from "@/components/ui/skeleton";

/**
 * Settings/More loading skeleton.
 *
 * Mirrors the settings hub layout: header, profile card, menu sections.
 */
export default function MoreLoading() {
  return (
    <main
      className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-6 pb-28"
      role="status"
      aria-label="Loading settings"
    >
      {/* Header */}
      <Skeleton className="h-7 w-24 rounded-lg" />

      {/* Profile card */}
      <Skeleton className="h-20 w-full rounded-2xl" />

      {/* Manage section */}
      <div>
        <Skeleton className="h-4 w-20 mb-3 rounded" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>

      {/* Overview section */}
      <div>
        <Skeleton className="h-4 w-24 mb-3 rounded" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>

      {/* Legal section */}
      <div>
        <Skeleton className="h-4 w-16 mb-3 rounded" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>

      <span className="sr-only">Loading…</span>
    </main>
  );
}

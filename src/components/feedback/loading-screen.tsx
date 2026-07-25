import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  className?: string;
}

/**
 * LoadingScreen — Full-screen skeleton loading state.
 *
 * Per design system: skeleton-based loading, no full-page spinners.
 * Shows a pulsing skeleton that mimics the app shell.
 */
export function LoadingScreen({ className }: LoadingScreenProps) {
  return (
    <div
      className={cn("flex flex-1 flex-col gap-6 px-4 py-6", className)}
      role="status"
      aria-label="Loading"
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-7 w-36 skeleton-shimmer rounded-lg" />
      </div>

      {/* Card skeletons */}
      <div className="flex flex-col gap-4">
        <div className="h-24 skeleton-shimmer rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 skeleton-shimmer rounded-2xl" />
          <div className="h-24 skeleton-shimmer rounded-2xl" />
        </div>
      </div>

      {/* List skeletons */}
      <div className="flex flex-col gap-3">
        <div className="h-4 w-24 skeleton-shimmer rounded" />
        <div className="h-16 skeleton-shimmer rounded-xl" />
        <div className="h-16 skeleton-shimmer rounded-xl" />
        <div className="h-16 skeleton-shimmer rounded-xl" />
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}

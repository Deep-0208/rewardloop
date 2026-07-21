import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  /** Compact variant for inline use inside cards */
  compact?: boolean;
  className?: string;
}

/**
 * EmptyState — Empty data display.
 *
 * Per 09_UI_UX_Specification §22: every empty state has
 * icon/illustration, title, description, and primary action.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  compact,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center",
        compact ? "gap-3 px-4 py-6" : "flex-1 px-8 py-12",
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl bg-muted",
            compact ? "size-12" : "size-16",
          )}
        >
          {icon}
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <h2
          className={cn(
            "font-semibold text-foreground",
            compact ? "text-base" : "text-lg",
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            "text-muted-foreground",
            compact ? "text-xs" : "max-w-xs text-sm",
          )}
        >
          {description}
        </p>
      </div>

      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

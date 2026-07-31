import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { EmptyStateIllustration } from "./empty-state-illustration";

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
        "flex flex-col items-center justify-center gap-4 text-center animate-fade-in",
        compact ? "gap-3 px-4 py-6" : "flex-1 px-8 py-12",
        className,
      )}
    >
      {icon ? (
        compact ? (
          <div
            className="flex items-center justify-center rounded-2xl bg-primary/8 size-14 text-primary"
          >
            {icon}
          </div>
        ) : (
          <EmptyStateIllustration icon={icon} />
        )
      ) : null}

      <div className="flex flex-col gap-1">
        <h2
          className={cn(
            "font-bold text-foreground tracking-tight",
            compact ? "text-base" : "text-lg",
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            "text-muted-foreground leading-relaxed",
            compact ? "text-xs" : "max-w-[240px] text-sm",
          )}
        >
          {description}
        </p>
      </div>

      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

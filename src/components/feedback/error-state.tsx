"use client";

import { cn } from "@/lib/utils";
import { AlertCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  /** Compact variant for inline use inside cards */
  compact?: boolean;
  className?: string;
}

/**
 * ErrorState — Error display with retry action.
 *
 * Human-readable messages, no technical jargon.
 * Source: 09_UI_UX_Specification §24 — Error States
 */
export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  onRetry,
  compact,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center",
        compact ? "gap-3 px-4 py-6" : "flex-1 px-8 py-12",
        className,
      )}
      role="alert"
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-destructive/10",
          compact ? "size-12" : "size-16",
        )}
      >
        <AlertCircle
          className={cn("text-destructive", compact ? "size-6" : "size-8")}
        />
      </div>

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

      {onRetry ? (
        <Button
          onClick={onRetry}
          variant="default"
          size={compact ? "default" : "touch"}
          className={compact ? undefined : "mt-1 px-6"}
        >
          Try Again
        </Button>
      ) : null}
    </div>
  );
}

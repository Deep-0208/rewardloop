"use client";

/**
 * LoadingOverlay — Full-screen loading overlay with backdrop.
 *
 * For route transitions and heavy operations.
 * Source: Design system — skeleton preferred over spinner.
 */

import { cn } from "@/lib/utils";
import { Loader2 } from "@/components/icons";

interface LoadingOverlayProps {
  /** Visible state */
  visible: boolean;
  /** Optional message */
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  visible,
  message,
  className,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="size-8 animate-spin text-primary"
          aria-hidden="true"
        />
        {message ? (
          <p className="text-sm font-medium text-muted-foreground">{message}</p>
        ) : null}
        <span className="sr-only">{message || "Loading…"}</span>
      </div>
    </div>
  );
}

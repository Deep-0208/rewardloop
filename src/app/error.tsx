"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/error-screen";
import { AppShell } from "@/components/app-shell";
import { logger } from "@/lib/logger";

/**
 * Root error boundary.
 *
 * Catches unhandled errors at the application level.
 * Provides a friendly retry option.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our telemetry system
    logger.error(
      `Unhandled React Error: ${error.message} (Digest: ${error.digest}) [Route: ${typeof window !== 'undefined' ? window.location.pathname : 'unknown'}]`
    );
  }, [error]);

  return (
    <AppShell>
      <ErrorScreen
        title="Something went wrong"
        description="An unexpected error occurred. Please try again."
        onRetry={reset}
      />
    </AppShell>
  );
}

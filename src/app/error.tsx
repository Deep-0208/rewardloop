"use client";

import { ErrorScreen } from "@/components/error-screen";
import { AppShell } from "@/components/app-shell";

/**
 * Root error boundary.
 *
 * Catches unhandled errors at the application level.
 * Provides a friendly retry option.
 */
export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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

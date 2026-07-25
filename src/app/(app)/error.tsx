"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/error-state";
import { createLogger } from "@/lib/logger";

const log = createLogger("app-error-boundary");

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Unhandled application error", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <ErrorState
        title="Unable to load page"
        description="We ran into an unexpected issue while loading this page. Please try again."
        onRetry={() => reset()}
      />
    </div>
  );
}

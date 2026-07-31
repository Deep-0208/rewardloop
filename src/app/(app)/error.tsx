"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { ErrorState } from "@/components/ui/feedback-states";
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
    posthog.captureException(error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <ErrorState
        title="Unable to load page"
        description="We ran into an unexpected issue while loading this page. Please try again."
        retry={() => reset()}
      />
    </div>
  );
}

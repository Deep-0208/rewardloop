"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "@/components/icons";
import { createLogger } from "@/lib/logger";

const log = createLogger("profile-error");

export default function ProfileError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    log.error("Profile route error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="size-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
        Unable to load profile
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        An error occurred while displaying your business profile details.
      </p>
      <Button onClick={reset} size="lg" className="gap-2">
        <RefreshCw className="size-4" />
        Try again
      </Button>
    </div>
  );
}

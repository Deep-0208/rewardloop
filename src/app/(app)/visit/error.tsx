"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft } from "@/components/icons";
import { createLogger } from "@/lib/logger";
import { useBillingStore } from "@/stores/billing-store";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

const log = createLogger("visit-error");

export default function VisitError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const resetStore = useBillingStore((s) => s.reset);
  const router = useRouter();

  useEffect(() => {
    log.error("Visit wizard route error", { message: error.message, digest: error.digest });
  }, [error]);

  const handleReturnToDashboard = () => {
    resetStore();
    router.replace(ROUTES.DASHBOARD);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center min-h-[60vh]">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="size-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
        Visit Workflow Disrupted
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        An unhandled error occurred during visit processing. Your store state has been preserved safely.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Button onClick={reset} size="lg" className="flex-1 gap-2">
          <RefreshCw className="size-4" />
          Retry Step
        </Button>
        <Button onClick={handleReturnToDashboard} variant="outline" size="lg" className="flex-1 gap-2">
          <ArrowLeft className="size-4" />
          Dashboard
        </Button>
      </div>
    </div>
  );
}

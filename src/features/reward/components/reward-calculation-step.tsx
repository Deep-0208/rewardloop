"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/feedback";
import { PageHeader } from "@/components/page-header";
import { StickyCTA } from "@/components/layout";
import {
  AlertCircle,
  CheckCircle,
  Gift,
  IndianRupee,
  Info,
  Wallet,
} from "@/components/icons";
import { formatCurrency } from "@/utils";
import { useBillingStore } from "@/stores/billing-store";
import { previewReward, validateReward } from "../actions";
import type { RewardSummary, RewardSummaryResponse } from "../types";
import { createRewardPreview } from "../utils/reward-preview";
import {
  formatPaiseForRupeeInput,
  parseRupeeInputToPaise,
  sanitizeRupeeInput,
} from "../utils/reward-input";

function RewardCalculationSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Rewards" subtitle="Step 3 of 4" />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Step 3 of the visit wizard: reward redemption and earning preview. */
export function RewardCalculationStep() {
  const customer = useBillingStore((state) => state.customer);
  const items = useBillingStore((state) => state.items);
  const storedRewardApplied = useBillingStore(
    (state) => state.rewardAppliedPaise,
  );
  const setRewardApplied = useBillingStore(
    (state) => state.setRewardAppliedPaise,
  );
  const setRewardSummary = useBillingStore((state) => state.setRewardSummary);
  const setStep = useBillingStore((state) => state.setStep);

  const [serverSummary, setServerSummary] = useState<RewardSummary | null>(
    null,
  );
  const [rewardInput, setRewardInput] = useState(() =>
    formatPaiseForRupeeInput(storedRewardApplied),
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const requestedRewardPaise = useMemo(() => {
    try {
      return parseRupeeInputToPaise(rewardInput);
    } catch {
      return 0;
    }
  }, [rewardInput]);

  const preview = useMemo(
    () =>
      serverSummary
        ? createRewardPreview(items, serverSummary, requestedRewardPaise)
        : null,
    [items, requestedRewardPaise, serverSummary],
  );

  const inputError = useMemo(() => {
    if (!preview || requestedRewardPaise === 0) return null;
    if (requestedRewardPaise < 100) return "Minimum redemption is ₹1.";
    if (requestedRewardPaise > preview.maxRedeemPaise) {
      return `This will be limited to ${formatCurrency(preview.maxRedeemPaise)}.`;
    }
    return null;
  }, [preview, requestedRewardPaise]);

  const requestSummary = useCallback((): Promise<RewardSummaryResponse> => {
    if (!customer || items.length === 0) {
      return Promise.resolve({
        success: false,
        error: "Add a customer and service before calculating rewards.",
        code: "VALIDATION_FAILED",
      });
    }

    return previewReward({
      customerId: customer.id,
      items: items.map((item) => ({
        catalogItemId: item.catalogItemId,
        quantity: item.quantity,
      })),
      rewardRequestedPaise: storedRewardApplied,
    });
  }, [customer, items, storedRewardApplied]);

  const applySummaryResult = useCallback(
    (result: RewardSummaryResponse) => {
      if (!result.success) {
        setLoadError(result.error);
        setIsLoading(false);
        return;
      }

      setServerSummary(result.data);
      setRewardInput(formatPaiseForRupeeInput(result.data.rewardAppliedPaise));
      setRewardSummary(result.data);
      setIsLoading(false);
    },
    [setRewardSummary],
  );

  useEffect(() => {
    let cancelled = false;

    void requestSummary().then((result) => {
      if (!cancelled) applySummaryResult(result);
    });

    return () => {
      cancelled = true;
    };
  }, [applySummaryResult, requestSummary]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    void requestSummary().then(applySummaryResult);
  }, [applySummaryResult, requestSummary]);

  const handleBack = useCallback(() => {
    setStep("catalog");
  }, [setStep]);

  const handleBlur = useCallback(() => {
    if (preview) {
      setRewardInput(formatPaiseForRupeeInput(preview.rewardAppliedPaise));
    }
  }, [preview]);

  const continueWithReward = useCallback(
    (rewardRequestedPaise: number) => {
      if (!customer) return;

      setSubmitError(null);
      startTransition(async () => {
        const result = await validateReward({
          customerId: customer.id,
          items: items.map((item) => ({
            catalogItemId: item.catalogItemId,
            quantity: item.quantity,
          })),
          rewardRequestedPaise,
        });

        if (!result.success) {
          setSubmitError(result.error);
          return;
        }

        setRewardApplied(result.data.summary.rewardAppliedPaise);
        setRewardSummary(result.data.summary);
        setStep("summary");
      });
    },
    [
      customer,
      items,
      setRewardApplied,
      setRewardSummary,
      setStep,
      startTransition,
    ],
  );

  const handleContinue = useCallback(() => {
    if (!preview || inputError) return;
    continueWithReward(preview.rewardAppliedPaise);
  }, [continueWithReward, inputError, preview]);

  const handleContinueWithoutReward = useCallback(() => {
    setRewardInput("0");
    continueWithReward(0);
  }, [continueWithReward]);

  if (!customer || items.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Rewards"
          subtitle="Step 3 of 4"
          onBack={handleBack}
        />
        <EmptyState
          icon={<Gift className="size-8 text-muted-foreground" />}
          title="Add a service first"
          description="Select at least one service before calculating rewards."
          action={
            <Button size="touch" onClick={handleBack}>
              Back to catalog
            </Button>
          }
        />
      </div>
    );
  }

  if (isLoading) return <RewardCalculationSkeleton />;

  if (loadError || !serverSummary || !preview) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Rewards"
          subtitle="Step 3 of 4"
          onBack={handleBack}
        />
        <ErrorState
          title="Unable to load reward details"
          description={loadError ?? "Please try again."}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const walletEmpty = preview.walletBalancePaise === 0;

  return (
    <div className="flex flex-1 flex-col pb-[120px]">
      <PageHeader title="Rewards" subtitle="Step 3 of 4" onBack={handleBack} />

      <main className="flex flex-1 flex-col p-4 animate-fade-in relative">
        {/* Rewards Card */}
        <div className="bg-card rounded-2xl p-5 mb-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-border/40">
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path
                      d="M12 8v8M8 12h8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="text-white dark:text-background"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[15px] text-foreground">
                    Available Rewards
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Balance: {formatCurrency(preview.walletBalancePaise)} • Max
                    Redeem: {formatCurrency(preview.maxRedeemPaise)}
                  </p>
                </div>
              </div>
            </div>

            {walletEmpty ? (
              <EmptyState
                compact
                icon={<Wallet className="size-6 text-muted-foreground" />}
                title="Customer has no rewards"
                description="They will earn rewards from this visit after payment."
                className="rounded-xl border bg-card"
              />
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-[20px]">
                  ₹
                </div>
                <input
                  id="reward-amount"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={rewardInput}
                  onChange={(event) =>
                    setRewardInput(sanitizeRupeeInput(event.target.value))
                  }
                  onBlur={handleBlur}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "+") {
                      e.preventDefault();
                    }
                  }}
                  className="w-full h-[64px] pl-[40px] pr-[16px] bg-muted/30 border-2 border-border/40 focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] rounded-xl text-[28px] font-bold outline-none transition-all tabular-nums"
                />
                <p
                  id="reward-help"
                  className={
                    inputError
                      ? "mt-2 text-xs text-destructive font-medium"
                      : "mt-2 text-xs text-muted-foreground"
                  }
                >
                  {inputError ??
                    "Tap a percentage or enter an amount manually."}
                </p>
              </div>
            )}

            {!walletEmpty && (
              <div className="flex items-center gap-2">
                {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
                  const chipPaise = Math.floor(preview.maxRedeemPaise * ratio);
                  const chipRupees = (chipPaise / 100).toString();
                  const label = `${ratio * 100}%`;
                  return (
                    <Button
                      key={ratio}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 flex-1 rounded-lg text-xs font-semibold"
                      onClick={() => setRewardInput(chipRupees)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reward Earned Preview */}
          <div className="mt-5 pt-4 border-t border-border/40 flex justify-between items-center">
            <div>
              <p className="text-[13px] text-muted-foreground font-medium">
                Earn Today
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                {preview.rewardPercentage}% of Final Pay
              </p>
            </div>
            <p className="font-bold text-[15px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              +{formatCurrency(preview.rewardEarnedPaise)}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </p>
          </div>
        </div>

        {submitError ? (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] bg-card/90 backdrop-blur-xl border-t border-border/20 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] z-10">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            disabled={isPending || !!inputError}
            onClick={handleContinue}
            className="w-full min-h-[56px] bg-primary text-primary-foreground font-semibold text-[16px] rounded-xl disabled:opacity-50 active:scale-[0.97] transition-all cursor-pointer shadow-[0_4px_16px_rgba(var(--primary),0.3)] flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-primary-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              "Continue to Review"
            )}
          </button>
          {!walletEmpty && (
            <div className="mt-3 text-center">
              <Button
                variant="link"
                size="sm"
                className="text-xs text-muted-foreground h-auto p-0"
                onClick={handleContinueWithoutReward}
                disabled={isPending}
              >
                Skip, don&apos;t redeem reward
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

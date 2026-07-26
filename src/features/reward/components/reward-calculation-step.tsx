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

function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span
        className={
          emphasis ? "font-semibold text-foreground" : "text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          emphasis
            ? "text-base font-semibold tabular-nums"
            : "font-medium tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

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
    <div className="flex flex-1 flex-col">
      <PageHeader title="Rewards" subtitle="Step 3 of 4" onBack={handleBack} />

      <main className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-5">
        <Card className="bg-primary text-primary-foreground ring-0">
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div>
              <p className="text-sm text-primary-foreground/75">
                Available reward
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {formatCurrency(preview.walletBalancePaise)}
              </p>
              <p className="mt-1 text-sm text-primary-foreground/75">
                {customer.name || customer.phone}
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
              <Wallet className="size-6" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Alert className="border-primary/20 bg-primary/5">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>
            Maximum redeem: {formatCurrency(preview.maxRedeemPaise)}
          </AlertTitle>
          <AlertDescription>
            Customer has {formatCurrency(preview.walletBalancePaise)} and can
            redeem up to this amount on this bill.
          </AlertDescription>
        </Alert>

        {walletEmpty ? (
          <EmptyState
            compact
            icon={<Wallet className="size-6 text-muted-foreground" />}
            title="Customer has no rewards"
            description="They will earn rewards from this visit after payment."
            className="rounded-xl border bg-card"
          />
        ) : (
          <Card>
            <CardContent className="p-5">
              <label
                htmlFor="reward-amount"
                className="text-sm font-medium text-foreground"
              >
                Redeem reward
              </label>
              <div className="relative mt-2">
                <IndianRupee
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="reward-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={rewardInput}
                  onChange={(event) =>
                    setRewardInput(sanitizeRupeeInput(event.target.value))
                  }
                  onBlur={handleBlur}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  aria-invalid={inputError ? true : undefined}
                  aria-describedby="reward-help"
                  className="h-14 rounded-[var(--radius-input)] pl-11 text-lg font-semibold tabular-nums"
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "+") {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
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
                      className="h-12 flex-1 rounded-lg text-xs font-semibold"
                      onClick={() => setRewardInput(chipRupees)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
              <p
                id="reward-help"
                className={
                  inputError
                    ? "mt-2 text-xs text-destructive"
                    : "mt-2 text-xs text-muted-foreground"
                }
              >
                {inputError ?? "Tap a percentage or enter an amount manually."}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Gift className="size-4 text-primary" aria-hidden="true" />
              <h2 className="font-medium">Reward summary</h2>
            </div>
            <SummaryRow
              label="Subtotal"
              value={formatCurrency(preview.subtotalPaise)}
            />
            <SummaryRow
              label="Reward used"
              value={`−${formatCurrency(preview.rewardAppliedPaise)}`}
            />
            <div className="border-t pt-3">
              <SummaryRow
                label="Final pay"
                value={formatCurrency(preview.finalPaidPaise)}
                emphasis
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg bg-[var(--color-success)]/10 px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <CheckCircle
                  className="size-4 text-[var(--color-success)]"
                  aria-hidden="true"
                />
                Reward earned
              </span>
              <span className="font-semibold tabular-nums text-[var(--color-success)]">
                +{formatCurrency(preview.rewardEarnedPaise)}
              </span>
            </div>
          </CardContent>
        </Card>

        {preview.requiresOtp ? (
          <Alert className="border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10">
            <AlertCircle
              className="size-4 text-[var(--color-warning)]"
              aria-hidden="true"
            />
            <AlertDescription>
              Reward redemption requires customer OTP verification before the
              visit can be completed.
            </AlertDescription>
          </Alert>
        ) : null}

        {submitError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}
      </main>

      <StickyCTA>
        <div className="flex flex-col gap-2">
          <Button
            size="full"
            onClick={handleContinue}
            disabled={Boolean(inputError) || isPending}
            loading={isPending}
          >
            Continue to summary
          </Button>
          {preview.rewardAppliedPaise > 0 ? (
            <Button
              size="touch"
              variant="ghost"
              onClick={handleContinueWithoutReward}
              disabled={isPending}
              className="w-full"
            >
              Continue without reward
            </Button>
          ) : null}
        </div>
      </StickyCTA>
    </div>
  );
}

"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OTPInput } from "@/components/forms/otp-input";
import { EmptyState, ErrorState } from "@/components/feedback";
import { PageHeader } from "@/components/page-header";
import {
  AlertCircle,
  CheckCircle,
  Receipt,
  User,
  Tag,
  Wallet,
} from "@/components/icons";
import { ROUTES } from "@/constants/routes";
import { formatCurrency } from "@/utils";
import { useBillingStore } from "@/stores/billing-store";
import {
  sendRewardOTP,
  retryRewardOTP,
  verifyRewardOTP,
} from "@/features/reward/actions";
import {
  completeVisit,
  generateCheckoutSummary,
  refreshCheckoutSummary,
} from "../actions";
import {
  formatPaiseForRupeeInput,
  parseRupeeInputToPaise,
  sanitizeRupeeInput,
} from "@/features/reward/utils/reward-input";
import type {
  CheckoutLineItem,
  CheckoutSummary,
  CheckoutSummaryResponse,
  VisitPaymentMethod,
} from "../types";

function CheckoutLine({ item }: { readonly item: CheckoutLineItem }) {
  return (
    <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {item.name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatCurrency(item.unitPricePaise)} × {item.quantity}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums">
        {formatCurrency(item.totalPaise)}
      </span>
    </li>
  );
}

function CheckoutSummarySkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Review bill" subtitle="Step 3 of 3" />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Final mobile checkout with payment, reward-OTP confirmation, and atomic commit. */
export function CheckoutSummaryStep() {
  const router = useRouter();
  const customer = useBillingStore((state) => state.customer);
  const selectedServices = useBillingStore((state) => state.selectedServices);
  const selectedProducts = useBillingStore((state) => state.selectedProducts);
  const items = useMemo(
    () => [...selectedServices, ...selectedProducts],
    [selectedServices, selectedProducts],
  );
  const rewardAppliedPaise = useBillingStore(
    (state) => state.rewardAppliedPaise,
  );
  const paymentMethod = useBillingStore((state) => state.paymentMethod);
  const otpVerifiedToken = useBillingStore((state) => state.otpVerifiedToken);
  const setCheckoutSummary = useBillingStore(
    (state) => state.setCheckoutSummary,
  );
  const setPaymentMethod = useBillingStore((state) => state.setPaymentMethod);
  const setOtpVerifiedToken = useBillingStore(
    (state) => state.setOtpVerifiedToken,
  );
  const setRewardAppliedPaise = useBillingStore(
    (state) => state.setRewardAppliedPaise,
  );
  const setStep = useBillingStore((state) => state.setStep);
  const reset = useBillingStore((state) => state.reset);

  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpState, setOtpState] = useState<"idle" | "sent" | "verified">(
    "idle",
  );
  const [otpResetKey, setOtpResetKey] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isOtpPending, startOtpTransition] = useTransition();
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const [rewardInput, setRewardInput] = useState(() =>
    formatPaiseForRupeeInput(rewardAppliedPaise),
  );

  const requestedRewardPaise = useMemo(() => {
    try {
      return parseRupeeInputToPaise(rewardInput);
    } catch {
      return 0;
    }
  }, [rewardInput]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (requestedRewardPaise !== rewardAppliedPaise) {
        setRewardAppliedPaise(requestedRewardPaise);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [requestedRewardPaise, rewardAppliedPaise, setRewardAppliedPaise]);

  const inputError = useMemo(() => {
    if (!summary || requestedRewardPaise === 0) return null;
    if (requestedRewardPaise < 100) return "Minimum redemption is ₹1.";
    if (requestedRewardPaise > summary.reward.maxRedeemPaise) {
      return `This will be limited to ${formatCurrency(summary.reward.maxRedeemPaise)}.`;
    }
    return null;
  }, [summary, requestedRewardPaise]);

  const requestInput = useMemo(
    () =>
      customer
        ? {
            customerId: customer.id,
            items: items.map((item) => ({
              catalogItemId: item.catalogItemId,
              quantity: item.quantity,
            })),
            rewardRequestedPaise: rewardAppliedPaise,
          }
        : null,
    [customer, items, rewardAppliedPaise],
  );

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(
      () => setResendSeconds((seconds) => Math.max(0, seconds - 1)),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const requestSummary = useCallback((): Promise<CheckoutSummaryResponse> => {
    if (!requestInput || requestInput.items.length === 0)
      return Promise.resolve({
        success: false,
        error: "Add a customer and service before reviewing the bill.",
        code: "VALIDATION_FAILED",
      });
    return generateCheckoutSummary(requestInput);
  }, [requestInput]);

  const applySummaryResult = useCallback(
    (result: CheckoutSummaryResponse) => {
      if (!result.success) {
        setLoadError(result.error);
        setIsLoading(false);
        return;
      }
      setSummary(result.data);
      setCheckoutSummary(result.data);
      setIsLoading(false);
    },
    [setCheckoutSummary],
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

  const handleBlur = useCallback(() => {
    if (summary) {
      setRewardInput(formatPaiseForRupeeInput(summary.rewardUsedPaise));
    }
  }, [summary]);

  const handleBack = useCallback(() => setStep("catalog"), [setStep]);

  const handleCancel = useCallback(() => {
    reset();
    router.replace(ROUTES.DASHBOARD);
  }, [reset, router]);

  const handleRetry = useCallback(() => {
    if (!requestInput) return;
    setIsLoading(true);
    setLoadError(null);
    void refreshCheckoutSummary(requestInput).then(applySummaryResult);
  }, [applySummaryResult, requestInput]);

  const handleSendOtp = useCallback(
    (isRetry = false) => {
      if (!customer || !summary) return;
      setOtpError(null);
      startOtpTransition(async () => {
        const result = await (isRetry ? retryRewardOTP : sendRewardOTP)({
          customerId: customer.id,
          rewardAmountPaise: summary.rewardUsedPaise,
        });
        if (!result.success) {
          setOtpError(result.error);
          return;
        }
        setOtpState("sent");
        setOtpVerifiedToken(null);
        setOtpResetKey((value) => value + 1);
        setResendSeconds(result.data.cooldownSeconds);
      });
    },
    [customer, setOtpVerifiedToken, startOtpTransition, summary],
  );

  const handleVerifyOtp = useCallback(
    (otp: string) => {
      if (!customer) return;
      setOtpError(null);
      startOtpTransition(async () => {
        const result = await verifyRewardOTP({ customerId: customer.id, otp });
        if (!result.success) {
          setOtpError(result.error);
          setOtpResetKey((value) => value + 1);
          return;
        }
        setOtpVerifiedToken(result.data.verifiedToken);
        setOtpState("verified");
      });
    },
    [customer, setOtpVerifiedToken, startOtpTransition],
  );

  const handleCompleteVisit = useCallback(async () => {
    if (!requestInput || !summary) return;
    setCompletionError(null);
    setIsCompleting(true);
    const result = await completeVisit({
      idempotencyKey,
      customerId: requestInput.customerId,
      items: requestInput.items,
      rewardAppliedPaise: summary.rewardUsedPaise,
      paymentMethod: summary.finalPayablePaise === 0 ? "none" : paymentMethod,
      otpVerifiedToken,
    });
    setIsCompleting(false);
    if (!result.success) {
      setCompletionError(result.error);
      return;
    }
    toast.success("✓ Visit Completed", { duration: 1_000 });
    window.setTimeout(() => {
      reset();
    }, 1_000);
  }, [
    idempotencyKey,
    otpVerifiedToken,
    paymentMethod,
    requestInput,
    reset,
    summary,
  ]);

  if (!customer || items.length === 0)
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Review bill"
          subtitle="Step 3 of 3"
          onBack={handleBack}
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          }
        />
        <EmptyState
          icon={<Receipt className="size-8 text-muted-foreground" />}
          title="Your bill is empty"
          description="Select at least one service or product before reviewing the bill."
          action={
            <Button
              size="touch"
              onClick={() => setStep(customer ? "catalog" : "customer")}
            >
              {customer ? "Back to catalog" : "Start over"}
            </Button>
          }
        />
      </div>
    );

  if (isLoading) return <CheckoutSummarySkeleton />;
  if (loadError || !summary)
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Review bill"
          subtitle="Step 3 of 3"
          onBack={handleBack}
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          }
        />
        <ErrorState
          title="Unable to load this bill"
          description={loadError ?? "Please try again."}
          onRetry={handleRetry}
        />
      </div>
    );

  const services = summary.items.filter((item) => item.type === "service");
  const products = summary.items.filter((item) => item.type === "product");
  const effectivePaymentMethod: VisitPaymentMethod =
    summary.finalPayablePaise === 0 ? "none" : paymentMethod;

  return (
    <div className="flex flex-1 flex-col pb-[120px] bg-muted/10 relative">
      <PageHeader
        title="Review bill"
        subtitle="Step 3 of 3"
        onBack={handleBack}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        }
      />

      <main className="flex flex-1 flex-col p-4 animate-fade-in relative z-0">
        <Card className="mb-4">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="truncate font-medium">
                {customer.name || "Customer"}
              </p>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
            </div>
          </CardContent>
        </Card>

        {services.length > 0 ? (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-medium">
                  <Receipt className="size-4 text-primary" aria-hidden="true" />
                  Selected services
                </h2>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(summary.serviceSubtotalPaise)}
                </span>
              </div>
              <ul className="divide-y">
                {services.map((item) => (
                  <CheckoutLine key={item.catalogItemId} item={item} />
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {products.length > 0 ? (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-medium">
                  <Tag className="size-4 text-primary" aria-hidden="true" />
                  Selected products
                </h2>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(summary.productSubtotalPaise)}
                </span>
              </div>
              <ul className="divide-y">
                {products.map((item) => (
                  <CheckoutLine key={item.catalogItemId} item={item} />
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {/* Rewards Card */}
        <div className="bg-card rounded-[var(--radius-card)] p-[var(--spacing-md)] mb-[var(--spacing-sm)] shadow-[var(--shadow-soft)] relative overflow-hidden">
          {/* Card Accent */}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-emerald-500/80" />

          <div className="flex flex-col gap-[var(--spacing-md)] pt-[4px]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-[var(--spacing-s)]">
                <div className="w-[44px] h-[44px] rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-[16px] text-[var(--color-text-primary)]">
                    Available Rewards
                  </p>
                  <p className="text-[12px] text-[var(--color-text-secondary)] mt-[2px]">
                    Balance: {formatCurrency(summary.walletBalancePaise)} • Max
                    Redeem: {formatCurrency(summary.reward.maxRedeemPaise)}
                  </p>
                </div>
              </div>
            </div>

            {summary.walletBalancePaise === 0 ? (
              <EmptyState
                compact
                icon={<Wallet className="size-6 text-muted-foreground" />}
                title="Customer has no rewards"
                description="They will earn rewards from this visit after payment."
                className="rounded-xl border bg-card"
              />
            ) : (
              <div className="relative">
                <div className="absolute left-[16px] top-[26px] -translate-y-1/2 text-[var(--color-text-tertiary)] font-bold text-[24px]">
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
                  className="w-full h-[72px] pl-[48px] pr-[16px] bg-card border-2 border-border/60 focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] rounded-[var(--radius-input)] text-[32px] font-bold text-[var(--color-text-primary)] outline-none transition-all tabular-nums shadow-[var(--shadow-soft)]"
                />
                <p
                  id="reward-help"
                  aria-live="polite"
                  className={
                    inputError
                      ? "mt-[8px] text-[12px] text-destructive font-medium"
                      : "mt-[8px] text-[12px] text-[var(--color-text-tertiary)]"
                  }
                >
                  {inputError ??
                    "Tap a percentage or enter an amount manually."}
                </p>
              </div>
            )}

            {summary.walletBalancePaise > 0 && (
              <div className="flex items-center gap-2">
                {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
                  const chipPaise = Math.floor(
                    summary.reward.maxRedeemPaise * ratio,
                  );
                  const chipRupees = (chipPaise / 100).toString();
                  const label = `${ratio * 100}%`;
                  return (
                    <Button
                      key={ratio}
                      type="button"
                      variant="outline"
                      className="h-[40px] flex-1 rounded-[12px] text-[13px] font-semibold border-border/60 hover:bg-muted"
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
          <div className="mt-[var(--spacing-md)] pt-[var(--spacing-sm)] border-t border-border/20 flex justify-between items-center">
            <div>
              <p className="text-[13px] text-[var(--color-text-secondary)] font-medium">
                Earn Today
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {summary.reward.rewardPercentage}% of Final Pay
              </p>
            </div>
            <p className="font-bold text-[16px] text-success bg-[var(--color-success-light)] px-[12px] py-[6px] rounded-[12px] flex items-center gap-[4px]">
              +{formatCurrency(summary.rewardEarnedPaise)}
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

        {/* Bill Summary Card */}
        <div className="bg-card rounded-[var(--radius-card)] p-[var(--spacing-md)] mb-[var(--spacing-sm)] flex flex-col items-center justify-center shadow-[var(--shadow-soft)] border border-border/40">
          <p className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-widest font-semibold mb-1">
            FINAL PAY
          </p>
          <h2 className="text-[40px] font-bold text-primary leading-none tracking-tight flex items-start">
            <span className="text-[20px] mt-1 mr-0.5">₹</span>
            {(summary.finalPayablePaise / 100).toFixed(0)}
          </h2>
          {summary.rewardUsedPaise > 0 && (
            <p className="text-[13px] text-[var(--color-text-tertiary)] font-medium mt-3">
              Original Bill {formatCurrency(summary.subtotalPaise)} •{" "}
              <span className="text-success font-semibold">
                Saved {formatCurrency(summary.rewardUsedPaise)}
              </span>
            </p>
          )}
        </div>

        {summary.finalPayablePaise > 0 ? (
          <div className="mb-6 mt-4">
            <p className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider mb-3 pl-1">
              Payment Method
            </p>
            <div className="flex bg-muted rounded-[24px] p-[4px] gap-[4px] border border-border/20">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`
                  flex-1 flex items-center justify-center gap-2 h-[56px] rounded-[var(--radius-button)] transition-all cursor-pointer
                  ${effectivePaymentMethod === "cash" ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(var(--primary),0.25)] font-semibold" : "text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"}
                `}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
                <span className="text-[15px]">Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("online")}
                className={`
                  flex-1 flex items-center justify-center gap-2 h-[56px] rounded-[var(--radius-button)] transition-all cursor-pointer
                  ${effectivePaymentMethod === "online" ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(var(--primary),0.25)] font-semibold" : "text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"}
                `}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <rect x="7" y="7" width="3" height="3" />
                  <rect x="14" y="7" width="3" height="3" />
                  <rect x="7" y="14" width="3" height="3" />
                  <rect x="14" y="14" width="3" height="3" />
                </svg>
                <span className="text-[14px]">Online</span>
              </button>
            </div>
          </div>
        ) : (
          <Alert className="border-emerald-500/30 bg-emerald-500/10 mt-4 rounded-2xl">
            <CheckCircle
              className="size-4 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <AlertDescription className="text-emerald-800 dark:text-emerald-200 font-medium">
              This reward fully covers the visit. No payment is needed.
            </AlertDescription>
          </Alert>
        )}

        {completionError ? (
          <Alert variant="destructive" className="mt-4 rounded-2xl">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>{completionError}</AlertDescription>
          </Alert>
        ) : null}
      </main>

      <div
        className="fixed bottom-0 left-0 right-0 p-[var(--spacing-md)] pb-[calc(var(--spacing-md)+env(safe-area-inset-bottom,0px))] bg-background/90 backdrop-blur-xl border-t border-border/20 shadow-[var(--shadow-soft)] z-[60]"
        style={{ width: "100%", left: 0, right: 0, bottom: 0 }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "512px",
            margin: "0 auto",
          }}
        >
          <button
            type="button"
            disabled={
              isCompleting ||
              isOtpPending ||
              (summary.requiresOtp && otpState === "sent" && !otpVerifiedToken)
            }
            onClick={
              summary.requiresOtp && !otpVerifiedToken && otpState === "idle"
                ? () => handleSendOtp()
                : handleCompleteVisit
            }
            className="h-[56px] bg-primary text-primary-foreground font-semibold text-[16px] rounded-[var(--radius-button)] disabled:opacity-50 active:scale-[0.97] transition-all cursor-pointer shadow-[0_4px_16px_rgba(var(--primary),0.3)] flex items-center justify-center gap-2"
            style={{ width: "100%" }}
          >
            {isCompleting || isOtpPending ? (
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
                <span>
                  {isOtpPending ? "Sending OTP..." : "Completing Visit..."}
                </span>
              </>
            ) : summary.requiresOtp && !otpVerifiedToken ? (
              "Verify Reward to Complete"
            ) : (
              "Complete Visit"
            )}
          </button>
        </div>
      </div>

      {/* Inline OTP Bottom Sheet Overlay */}
      {summary.requiresOtp && otpState === "sent" && !otpVerifiedToken && (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setOtpState("idle")}
          />
          <div className="relative bg-card w-full rounded-t-[32px] p-[var(--spacing-md)] pt-6 pb-[calc(32px+env(safe-area-inset-bottom,0px))] animate-in slide-in-from-bottom-full duration-300 shadow-[var(--shadow-hero)] border-t border-border/40">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-[var(--spacing-md)]" />

            <h3 className="text-[22px] font-bold text-[var(--color-text-primary)] mb-1 text-center">
              Verify Reward
            </h3>
            <p className="text-[14px] text-[var(--color-text-secondary)] mb-8 text-center">
              OTP sent to {customer.phone.replace(/.(?=.{4})/g, "x")}
            </p>

            <div className="mb-8">
              <OTPInput
                key={otpResetKey}
                label=""
                error={otpError ?? undefined}
                disabled={isOtpPending}
                onComplete={handleVerifyOtp}
              />
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-xl font-semibold"
              disabled={resendSeconds > 0 || isOtpPending}
              onClick={() => handleSendOtp(true)}
            >
              {resendSeconds > 0
                ? `Resend code in ${resendSeconds}s`
                : "Resend code"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

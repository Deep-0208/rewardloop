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
import { cn } from "@/lib/utils";
import { OTPInput } from "@/components/forms/otp-input";
import { EmptyState, ErrorState } from "@/components/feedback";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import {
  AlertCircle,
  CheckCircle,
  IndianRupee,
  Receipt,
  User,
  Tag,
  Wallet,
  Banknote,
  Smartphone,
} from "@/components/icons";
import { ROUTES } from "@/constants/routes";
import { formatCurrency } from "@/utils";
import { useBillingStore } from "@/stores/billing-store";
import posthog from "posthog-js";
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
import { VisitSuccessScreen } from "./visit-success-screen";

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
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState<string | null>(null);
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
          toast.error(result.error);
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

  const handleCompleteVisit = useCallback(
    async (overrideToken?: string | React.MouseEvent) => {
      if (!requestInput || !summary) return;
      setCompletionError(null);
      setIsCompleting(true);

      const tokenToUse =
        typeof overrideToken === "string" ? overrideToken : otpVerifiedToken;

      const result = await completeVisit({
        idempotencyKey,
        customerId: requestInput.customerId,
        items: requestInput.items,
        rewardAppliedPaise: summary.rewardUsedPaise,
        paymentMethod: summary.finalPayablePaise === 0 ? "none" : paymentMethod,
        otpVerifiedToken: tokenToUse,
      });
      setIsCompleting(false);
      if (!result.success) {
        setCompletionError(result.error);
        return;
      }
      posthog.capture("visit_completed", {
        subtotal_paise: result.data.subtotalPaise,
        reward_used_paise: result.data.rewardUsedPaise,
        reward_earned_paise: result.data.rewardEarnedPaise,
        final_paid_paise: result.data.finalPaidPaise,
        payment_method:
          summary.finalPayablePaise === 0 ? "none" : paymentMethod,
        items_count: requestInput.items.length,
        is_duplicate: result.data.duplicate,
      });
      toast.success("✓ Visit Completed", { duration: 3_000 });
      setCompletedPaymentMethod(
        summary.finalPayablePaise === 0 ? "none" : paymentMethod,
      );
      reset();
    },
    [
      idempotencyKey,
      otpVerifiedToken,
      paymentMethod,
      requestInput,
      reset,
      summary,
    ],
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

        // Auto-complete immediately after verification
        void handleCompleteVisit(result.data.verifiedToken);
      });
    },
    [customer, setOtpVerifiedToken, startOtpTransition, handleCompleteVisit],
  );

  if (completedPaymentMethod !== null && summary && customer)
    return (
      <VisitSuccessScreen
        customerName={customer.name || "Customer"}
        customerPhone={customer.phone}
        summary={summary}
        paymentMethod={completedPaymentMethod}
      />
    );

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
  const isDebouncing = requestedRewardPaise !== summary.rewardUsedPaise;

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
                  <IndianRupee className="size-4 text-primary" aria-hidden="true" />
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
        <div className="bg-card rounded-[var(--radius-card)] p-[var(--spacing-md)] mb-[var(--spacing-sm)] shadow-sm border border-border/40 relative overflow-hidden">
          <div className="flex flex-col gap-[var(--spacing-md)]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-[var(--spacing-s)]">
                <div className="w-[36px] h-[36px] rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Wallet className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-[15px] text-[var(--color-text-primary)]">
                    Available Rewards
                  </p>
                  <p className="text-[12px] text-[var(--color-text-secondary)] mt-[2px]">
                    Balance: {formatCurrency(summary.walletBalancePaise)} • Max:{" "}
                    {formatCurrency(summary.reward.maxRedeemPaise)}
                  </p>
                </div>
              </div>
            </div>

            {summary.walletBalancePaise === 0 ? (
              <EmptyState
                compact
                icon={<Wallet className="size-5 text-muted-foreground" />}
                title="Customer has no rewards"
                description="They will earn rewards from this visit after payment."
                className="rounded-xl border bg-card/50"
              />
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative group">
                  <Label htmlFor="reward-amount" className="sr-only">
                    Reward amount in rupees
                  </Label>
                  <div className="absolute left-[16px] top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-[16px]" aria-hidden="true">
                    ₹
                  </div>
                  <input
                    id="reward-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    aria-label="Reward amount in rupees"
                    aria-describedby={inputError ? "reward-amount-error" : undefined}
                    aria-invalid={inputError ? true : undefined}
                    value={rewardInput}
                    onChange={(event) => {
                      let val = event.target.value;
                      if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                        val = val.replace(/^0+/, "");
                        if (val === "") val = "0";
                      }
                      setRewardInput(sanitizeRupeeInput(val));
                    }}
                    onFocus={(e) => e.target.select()}
                    onBlur={handleBlur}
                    className="w-full h-12 pl-[36px] pr-[16px] bg-muted/30 border border-border/60 hover:border-border focus:border-primary focus:ring-[3px] focus:ring-primary/10 rounded-[var(--radius-input)] text-[24px] font-semibold text-right text-[var(--color-text-primary)] outline-none transition-all tabular-nums"
                  />
                </div>

                {inputError && (
                  <p id="reward-amount-error" className="text-[12px] text-destructive font-medium px-1" role="alert">
                    {inputError}
                  </p>
                )}

                <div className="flex items-center bg-muted/50 p-1 rounded-[16px] border border-border/40 gap-1">
                  {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
                    const chipPaise = Math.floor(
                      summary.reward.maxRedeemPaise * ratio,
                    );
                    const chipRupees = (chipPaise / 100).toString();
                    const label = ratio === 1.0 ? "Max" : `${ratio * 100}%`;
                    const isActive =
                      rewardInput === chipRupees &&
                      rewardInput !== "" &&
                      rewardInput !== "0";
                    return (
                      <button
                        key={ratio}
                        type="button"
                        aria-pressed={isActive}
                        className={`h-[36px] flex-1 rounded-[12px] text-[13px] font-semibold transition-all ${isActive ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => setRewardInput(chipRupees)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bill Summary Card */}
        <div className="bg-card rounded-[var(--radius-card)] p-[var(--spacing-md)] mb-[var(--spacing-sm)] flex flex-col shadow-sm border border-border/40">
          <div className="flex flex-col gap-2 border-b border-border/40 pb-4 mb-4">
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-muted-foreground">Original Bill</span>
              <span className="font-medium text-foreground">
                {formatCurrency(summary.subtotalPaise)}
              </span>
            </div>
            {summary.rewardUsedPaise > 0 && (
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Reward Redeemed
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  -{formatCurrency(summary.rewardUsedPaise)}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-4">
            <p className="text-[12px] text-muted-foreground uppercase tracking-widest font-semibold">
              Final Pay
            </p>
            <h2 className="text-[36px] font-bold text-primary leading-none tracking-tight flex items-start">
              <span className="text-[18px] mt-1 mr-0.5 font-medium text-primary/70">
                ₹
              </span>
              {(summary.finalPayablePaise / 100).toFixed(0)}
            </h2>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center text-[14px]">
            <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium">
              <Wallet className="size-4" />
              Earn Today{" "}
              <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                {summary.reward.rewardPercentage}%
              </span>
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              +{formatCurrency(summary.rewardEarnedPaise)}
            </span>
          </div>
        </div>

        {summary.finalPayablePaise > 0 ? (
          <div className="mb-6 mt-4">
            <p className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider mb-2 pl-1">
              Payment Method
            </p>
            <div className="flex bg-muted/40 rounded-[16px] p-1 gap-1 border border-border/40 relative" role="radiogroup" aria-label="Payment method">
              <button
                type="button"
                role="radio"
                aria-checked={effectivePaymentMethod === "cash"}
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-2 h-11 rounded-[12px] transition-all duration-300 outline-none cursor-pointer",
                  effectivePaymentMethod === "cash"
                    ? "bg-background text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-border/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]"
                )}
              >
                <Banknote className={cn("size-[18px]", effectivePaymentMethod === "cash" ? "text-primary" : "opacity-70")} aria-hidden="true" />
                <span className="text-[14px]">Cash</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={effectivePaymentMethod === "online"}
                onClick={() => setPaymentMethod("online")}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-2 h-11 rounded-[12px] transition-all duration-300 outline-none cursor-pointer",
                  effectivePaymentMethod === "online"
                    ? "bg-background text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-border/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]"
                )}
              >
                <Smartphone className={cn("size-[18px]", effectivePaymentMethod === "online" ? "text-primary" : "opacity-70")} aria-hidden="true" />
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

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-background/80 backdrop-blur-xl border-t border-border/40 z-[60]">
        <div className="max-w-[768px] mx-auto w-full">
          <Button
            size="full"
            loading={
              isCompleting ||
              (isOtpPending && (otpState === "idle" || otpState === "sent"))
            }
            disabled={
              isCompleting ||
              isOtpPending ||
              isDebouncing ||
              isLoading ||
              (summary.requiresOtp && otpState === "sent" && !otpVerifiedToken)
            }
            onClick={
              summary.requiresOtp && !otpVerifiedToken && otpState === "idle"
                ? () => handleSendOtp()
                : handleCompleteVisit
            }
            className="shadow-[0_4px_16px_rgba(79,70,229,0.3)]"
          >
            {summary.requiresOtp && !otpVerifiedToken
              ? "Verify Reward to Complete"
              : "Complete Visit"}
          </Button>
        </div>
      </div>

      {/* OTP Verification Drawer */}
      <Drawer
        open={
          summary.requiresOtp &&
          otpState === "sent" &&
          !otpVerifiedToken
        }
        onOpenChange={(open) => {
          if (!open) setOtpState("idle");
        }}
        showSwipeHandle
      >
        <DrawerContent className="mx-auto max-w-[512px]">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-[22px] font-bold">
              Verify Reward
            </DrawerTitle>
            <p className="text-[14px] text-muted-foreground mt-1">
              OTP sent to {customer.phone.replace(/.(?=.{4})/g, "x")}
            </p>
          </DrawerHeader>

          <div className="px-4 pb-8">
            <div className="mb-8">
              <OTPInput
                key={otpResetKey}
                length={4}
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
                ? `Resend SMS in ${resendSeconds}s`
                : "Resend code"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

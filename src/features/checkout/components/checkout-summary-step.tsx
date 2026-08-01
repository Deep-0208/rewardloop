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
import { OTPInput } from "@/features/auth/components/otp-input";
import { EmptyState, ErrorState } from "@/components/ui/feedback-states";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PageHeader } from "@/components/page-header";
import {
  AlertCircle,
  CheckCircle,
  IndianRupee,
  Receipt,
  User,
  Tag,
  Wallet,
  Sparkles,
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
} from "@/features/reward/utils/reward-input";
import type { CheckoutSummary, CheckoutSummaryResponse } from "../types";
import { VisitSuccessScreen } from "./visit-success-screen";
import { PaymentSelector } from "./payment-selector";
import { RewardRedemptionCard } from "./reward-redemption-card";
import { CheckoutLine } from "./checkout-line-item";

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
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState<
    string | null
  >(null);
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
          icon={Receipt}
          title="Your bill is empty"
          description="Select at least one service or product before reviewing the bill."
          action={
            <Button
              size="lg"
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
          retry={handleRetry}
        />
      </div>
    );

  const services = summary.items.filter((item) => item.type === "service");
  const products = summary.items.filter((item) => item.type === "product");
  const effectivePaymentMethod =
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
                  <IndianRupee
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
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

        <RewardRedemptionCard
          walletBalancePaise={summary.walletBalancePaise}
          maxRedeemPaise={summary.reward.maxRedeemPaise}
          rewardInput={rewardInput}
          onRewardInputChange={(val) => setRewardInput(val)}
          onBlur={handleBlur}
        />

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

          <div className="flex justify-between items-center p-3.5 rounded-[var(--radius-lg)] bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <Sparkles className="size-4" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm tracking-tight">
                  Earn Today
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/20 tabular-nums tracking-wider uppercase">
                  {summary.reward.rewardPercentage}% BACK
                </span>
              </div>
            </div>
            <span className="font-extrabold text-primary text-base tracking-tight tabular-nums">
              +{formatCurrency(summary.rewardEarnedPaise)}
            </span>
          </div>
        </div>

        {summary.finalPayablePaise > 0 ? (
          <PaymentSelector
            value={effectivePaymentMethod}
            onChange={(val) => setPaymentMethod(val)}
          />
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
            size="lg"
            className="w-full shadow-[var(--shadow-hero)]"
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
          >
            {summary.requiresOtp && !otpVerifiedToken
              ? "Verify Reward to Complete"
              : "Complete Visit"}
          </Button>
        </div>
      </div>

      {/* OTP Verification Drawer */}
      <Drawer
        open={summary.requiresOtp && otpState === "sent" && !otpVerifiedToken}
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

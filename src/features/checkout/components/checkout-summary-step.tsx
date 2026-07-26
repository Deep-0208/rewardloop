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
      <PageHeader title="Review bill" subtitle="Step 4 of 4" />
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
  const items = useBillingStore((state) => state.items);
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

  const handleBack = useCallback(() => setStep("reward"), [setStep]);

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
      router.replace(ROUTES.DASHBOARD);
    }, 1_000);
  }, [
    idempotencyKey,
    otpVerifiedToken,
    paymentMethod,
    requestInput,
    reset,
    router,
    summary,
  ]);

  if (!customer || items.length === 0)
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Review bill"
          subtitle="Step 4 of 4"
          onBack={handleBack}
        />
        <EmptyState
          icon={<Receipt className="size-8 text-muted-foreground" />}
          title="Your bill is empty"
          description="Select at least one service or product before reviewing the bill."
          action={
            <Button size="touch" onClick={() => setStep("catalog")}>
              Back to catalog
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
          subtitle="Step 4 of 4"
          onBack={handleBack}
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
  const otpVerified =
    !summary.requiresOtp ||
    (otpState === "verified" && Boolean(otpVerifiedToken));

  return (
    <div className="flex flex-1 flex-col pb-[120px] bg-muted/10 relative">
      <PageHeader
        title="Review bill"
        subtitle="Step 4 of 4"
        onBack={handleBack}
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

        {/* Bill Summary Card */}
        <div className="bg-card rounded-2xl p-6 mb-3 flex flex-col items-center justify-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-border/40">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">
            FINAL PAY
          </p>
          <h2 className="text-[40px] font-bold text-primary leading-none tracking-tight flex items-start">
            <span className="text-[20px] mt-1 mr-0.5">₹</span>
            {(summary.finalPayablePaise / 100).toFixed(0)}
          </h2>
          {summary.rewardUsedPaise > 0 && (
            <p className="text-[13px] text-muted-foreground font-medium mt-3">
              Original Bill {formatCurrency(summary.subtotalPaise)} •{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
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
            <div className="flex bg-muted/40 rounded-[20px] p-1 gap-1 border border-border/40">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`
                  flex-1 flex items-center justify-center gap-2 min-h-[56px] rounded-2xl transition-all cursor-pointer
                  ${effectivePaymentMethod === "cash" ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(var(--primary),0.25)] font-semibold" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"}
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
                  flex-1 flex items-center justify-center gap-2 min-h-[56px] rounded-2xl transition-all cursor-pointer
                  ${effectivePaymentMethod === "online" ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(var(--primary),0.25)] font-semibold" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"}
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

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] bg-card/90 backdrop-blur-xl border-t border-border/20 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] z-10">
        <div className="mx-auto max-w-lg">
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
            className="w-full min-h-[56px] bg-primary text-primary-foreground font-semibold text-[16px] rounded-xl disabled:opacity-50 active:scale-[0.97] transition-all cursor-pointer shadow-[0_4px_16px_rgba(var(--primary),0.3)] flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setOtpState("idle")}
          />
          <div className="relative bg-card w-full rounded-t-3xl p-6 pb-[calc(32px+env(safe-area-inset-bottom,0px))] animate-in slide-in-from-bottom-full duration-300">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />

            <h3 className="text-[20px] font-bold text-foreground mb-1">
              Verify Reward
            </h3>
            <p className="text-[14px] text-muted-foreground mb-8">
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

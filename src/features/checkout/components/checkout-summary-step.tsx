"use client";
import { motion, AnimatePresence } from "motion/react";

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
import { StickyCTA } from "@/components/layout";
import { PageHeader } from "@/components/page-header";
import {
  AlertCircle,
  CheckCircle,
  Gift,
  Receipt,
  Tag,
  User,
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
import type {
  CheckoutLineItem,
  CheckoutSummary,
  CheckoutSummaryResponse,
  VisitPaymentMethod,
} from "../types";

function AmountRow({
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
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Review bill"
        subtitle="Step 4 of 4"
        onBack={handleBack}
      />
      <main className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-5">
        <Card>
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
          <Card>
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
          <Card>
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
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-medium">Payment summary</h2>
            <AmountRow
              label="Service subtotal"
              value={formatCurrency(summary.serviceSubtotalPaise)}
            />
            <AmountRow
              label="Product subtotal"
              value={formatCurrency(summary.productSubtotalPaise)}
            />
            <AmountRow
              label="Total subtotal"
              value={formatCurrency(summary.subtotalPaise)}
            />
            <AmountRow
              label="Reward redeemed"
              value={`−${formatCurrency(summary.rewardUsedPaise)}`}
            />
            <div className="border-t pt-3">
              <AmountRow
                label="Final payable"
                value={formatCurrency(summary.finalPayablePaise)}
                emphasis
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--color-success)]/20 bg-[var(--color-success)]/5">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Gift
                className="size-4 text-[var(--color-success)]"
                aria-hidden="true"
              />
              <h2 className="font-medium">Reward after this visit</h2>
            </div>
            <AmountRow
              label="Reward earned"
              value={`+${formatCurrency(summary.rewardEarnedPaise)}`}
            />
            <div className="flex items-center justify-between gap-3 rounded-lg bg-background/70 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="size-4 text-primary" aria-hidden="true" />
                Wallet after visit
              </span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(summary.walletAfterVisitPaise)}
              </span>
            </div>
          </CardContent>
        </Card>
        {summary.finalPayablePaise > 0 ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <h2 className="font-medium">Payment method</h2>
              <div
                className="grid grid-cols-2 gap-3"
                role="radiogroup"
                aria-label="Payment method"
              >
                <Button
                  size="touch"
                  variant={
                    effectivePaymentMethod === "cash" ? "default" : "outline"
                  }
                  onClick={() => setPaymentMethod("cash")}
                  role="radio"
                  aria-checked={effectivePaymentMethod === "cash"}
                >
                  Cash
                </Button>
                <Button
                  size="touch"
                  variant={
                    effectivePaymentMethod === "online" ? "default" : "outline"
                  }
                  onClick={() => setPaymentMethod("online")}
                  role="radio"
                  aria-checked={effectivePaymentMethod === "online"}
                >
                  Online
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Alert className="border-muted">
            <CheckCircle
              className="size-4 text-[var(--color-success)]"
              aria-hidden="true"
            />
            <AlertDescription>
              This reward fully covers the visit. No payment is needed.
            </AlertDescription>
          </Alert>
        )}
        {summary.requiresOtp ? (
          <Card>
            <CardContent className="space-y-4 p-4">
              <div>
                <h2 className="font-medium">Confirm reward redemption</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send a 6-digit OTP to {customer.phone} before completing this
                  visit.
                </p>
              </div>
              <AnimatePresence mode="popLayout">
                {otpState === "idle" ? (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      size="touch"
                      className="w-full"
                      onClick={() => handleSendOtp()}
                      loading={isOtpPending}
                    >
                      Send verification code
                    </Button>
                  </motion.div>
                ) : null}
                {otpState === "sent" ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <OTPInput
                      key={otpResetKey}
                      label="Enter the 6-digit OTP"
                      error={otpError ?? undefined}
                      disabled={isOtpPending}
                      onComplete={handleVerifyOtp}
                    />
                    <Button
                      variant="outline"
                      size="touch"
                      className="w-full"
                      disabled={resendSeconds > 0 || isOtpPending}
                      onClick={() => handleSendOtp(true)}
                    >
                      {resendSeconds > 0
                        ? `Resend code in ${resendSeconds}s`
                        : "Resend code"}
                    </Button>
                  </motion.div>
                ) : null}
                {otpState === "verified" ? (
                  <motion.div
                    key="verified"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert className="border-[var(--color-success)]/30 bg-[var(--color-success)]/10">
                      <CheckCircle
                        className="size-4 text-[var(--color-success)]"
                        aria-hidden="true"
                      />
                      <AlertDescription>
                        Reward OTP verified. You can complete this visit.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              {otpState === "idle" && otpError ? (
                <p className="text-sm text-destructive" role="alert">
                  {otpError}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
        {completionError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>{completionError}</AlertDescription>
          </Alert>
        ) : null}
      </main>
      <StickyCTA>
        <Button
          size="full"
          onClick={handleCompleteVisit}
          disabled={!otpVerified || isCompleting || isOtpPending}
          loading={isCompleting}
        >
          Complete Visit
        </Button>
        {summary.requiresOtp && !otpVerified ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Verify the reward OTP to enable completion.
          </p>
        ) : null}
      </StickyCTA>
    </div>
  );
}

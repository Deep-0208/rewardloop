"use client";

import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, User, Receipt, Wallet } from "@/components/icons";
import { ROUTES } from "@/constants/routes";
import { formatCurrency } from "@/utils";
import type { CheckoutSummary } from "../types";

interface VisitSuccessScreenProps {
  /** Customer name/phone for receipt display */
  customerName: string;
  customerPhone: string;
  /** Server-verified checkout summary with final amounts */
  summary: CheckoutSummary;
  /** Payment method used (cash, online, or none if fully covered by reward) */
  paymentMethod: string;
}

/**
 * VisitSuccessScreen — Post-completion receipt screen.
 *
 * Replaces the 1s toast + instant reset pattern with a proper success state
 * showing the merchant what was just committed: customer, amounts, and reward earned.
 *
 * Auto-navigates to dashboard after 8 seconds, or immediately on button tap.
 */
export function VisitSuccessScreen({
  customerName,
  customerPhone,
  summary,
  paymentMethod,
}: VisitSuccessScreenProps) {
  const router = useRouter();

  const handleDone = useCallback(() => {
    router.replace(ROUTES.DASHBOARD);
  }, [router]);

  // Auto-redirect after 8 seconds
  useEffect(() => {
    const timer = window.setTimeout(handleDone, 8_000);
    return () => window.clearTimeout(timer);
  }, [handleDone]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 animate-fade-in">
      {/* Success icon */}
      <div className="flex size-20 items-center justify-center rounded-full bg-[var(--color-success)]/10 mb-6">
        <CheckCircle className="size-10 text-[var(--color-success)]" />
      </div>

      <h1 className="text-[24px] font-bold text-foreground tracking-tight mb-1">
        Visit Completed
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Transaction recorded successfully
      </p>

      {/* Receipt Card */}
      <Card className="w-full max-w-sm mb-6">
        <CardContent className="p-5 space-y-4">
          {/* Customer */}
          <div className="flex items-center gap-3 pb-3 border-b border-border/40">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">
                {customerName || "Customer"}
              </p>
              <p className="text-xs text-muted-foreground">{customerPhone}</p>
            </div>
          </div>

          {/* Amounts */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Receipt className="size-3.5" aria-hidden="true" />
                Subtotal
              </span>
              <span className="font-medium tabular-nums">
                {formatCurrency(summary.subtotalPaise)}
              </span>
            </div>

            {summary.rewardUsedPaise > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600 font-medium">
                  Reward Redeemed
                </span>
                <span className="font-bold text-emerald-600 tabular-nums">
                  -{formatCurrency(summary.rewardUsedPaise)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm pt-2 border-t border-border/40">
              <span className="font-semibold text-foreground">Final Paid</span>
              <span className="font-bold text-foreground tabular-nums">
                {formatCurrency(summary.finalPayablePaise)}
              </span>
            </div>

            {paymentMethod !== "none" && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="text-muted-foreground capitalize">
                  {paymentMethod}
                </span>
              </div>
            )}
          </div>

          {/* Reward Earned */}
          {summary.rewardEarnedPaise > 0 && (
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mt-2">
              <span className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium">
                <Wallet className="size-4" aria-hidden="true" />
                Earned
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                +{formatCurrency(summary.rewardEarnedPaise)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Done CTA */}
      <Button size="full" className="max-w-sm" onClick={handleDone}>
        Done
      </Button>

      <p className="text-xs text-muted-foreground mt-4">
        Returning to dashboard automatically…
      </p>
    </div>
  );
}

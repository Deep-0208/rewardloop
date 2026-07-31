"use client";

import { useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/utils";
import type { RecentTransaction } from "../types";
import { EmptyState } from "@/components/ui/feedback-states";
import { CustomerAvatar } from "@/components/ui/avatar";

interface RecentTransactionsListProps {
  transactions: RecentTransaction[];
}

export function RecentTransactionsList({
  transactions,
}: RecentTransactionsListProps) {
  const recentSlice = useMemo(() => transactions.slice(0, 5), [transactions]);

  if (transactions.length === 0) {
    return (
      <section
        className="px-[var(--spacing-md)] mt-[var(--spacing-md)] pb-[120px] animate-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        <div className="flex items-center justify-between mb-[var(--spacing-s)]">
          <h2 className="text-[12px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Recent Sales
          </h2>
        </div>
        <EmptyState
          title="No sales yet"
          description="Sales recorded today will appear here."
          className="bg-card shadow-[var(--shadow-card)] border border-border/40 py-8 rounded-[var(--radius-card)]"
        />
      </section>
    );
  }

  return (
    <section
      className="px-[var(--spacing-md)] mt-[var(--spacing-md)] pb-[120px] animate-fade-in"
      style={{ animationDelay: "100ms" }}
      aria-label="Recent transactions"
    >
      <div className="flex items-center justify-between mb-[var(--spacing-s)]">
        <h2 className="text-[12px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Recent Sales
        </h2>
        <Link
          href="/sales"
          className="text-[11px] font-semibold text-primary uppercase tracking-wide hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="flex flex-col gap-[var(--spacing-s)]">
        {recentSlice.map((txn) => {
          const customerDisplayName = txn.customerName || "Walk-in Customer";
          const hasReward = txn.rewardUsedPaise > 0;

          return (
            <div
              key={txn.id}
              className="bg-card rounded-[var(--radius-card)] p-[var(--spacing-sm)] shadow-[var(--shadow-soft)] flex items-center justify-between transition-all hover:shadow-md hover:border-border/60 border border-border/20"
            >
              <div className="flex items-center gap-[var(--spacing-s)]">
                <CustomerAvatar
                  name={txn.customerName}
                  seed={txn.customerName || txn.id}
                  size="lg"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-[15px] text-[var(--color-text-primary)] leading-tight">
                    {customerDisplayName}
                  </span>
                  <div className="flex items-center gap-[4px] mt-[2px]">
                    <span className="text-[12px] text-[var(--color-text-secondary)]">
                      Bill: {formatCurrency(txn.subtotalPaise)}
                      {txn.productSubtotalPaise > 0 && (
                        <span className="text-[11px] opacity-80 ml-[2px]">
                          (S: {formatCurrency(txn.serviceSubtotalPaise)} • P:{" "}
                          {formatCurrency(txn.productSubtotalPaise)})
                        </span>
                      )}
                    </span>
                    {hasReward && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border/80" />
                        <span className="text-[11px] font-semibold text-success bg-[var(--color-success-light)] px-[6px] py-[2px] rounded-md">
                          -{formatCurrency(txn.rewardUsedPaise)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="font-bold text-[16px] tabular-nums text-[var(--color-text-primary)]">
                  {formatCurrency(txn.finalPaidPaise)}
                </span>
                <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] mt-[2px] px-[6px] py-[2px] bg-muted/50 rounded-md uppercase tracking-wide">
                  {txn.paymentMethod}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


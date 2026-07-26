"use client";

import { useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/utils";
import type { RecentTransaction } from "../types";
import { EmptyState } from "@/components/feedback";

interface RecentTransactionsListProps {
  transactions: RecentTransaction[];
}

function getInitials(name?: string | null) {
  if (!name) return "??";
  const trimmed = name.trim();
  if (!trimmed) return "??";
  const parts = trimmed.split(" ");
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  }
  return trimmed.substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
];

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
          href="/transactions"
          className="text-[11px] font-semibold text-primary uppercase tracking-wide hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="flex flex-col gap-[var(--spacing-s)]">
        {recentSlice.map((txn, index) => {
          const initials = getInitials(txn.customerName);
          const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
          const hasReward = txn.rewardUsedPaise > 0;

          return (
            <div
              key={txn.id}
              className="bg-card rounded-[var(--radius-card)] p-[var(--spacing-sm)] shadow-[var(--shadow-soft)] flex items-center justify-between"
            >
              <div className="flex items-center gap-[var(--spacing-s)]">
                <div
                  className={`w-[44px] h-[44px] rounded-full flex items-center justify-center text-[15px] font-bold shrink-0 ${colorClass}`}
                >
                  {initials}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[15px] text-[var(--color-text-primary)] leading-tight">
                    {txn.customerName || "Walk-in Customer"}
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

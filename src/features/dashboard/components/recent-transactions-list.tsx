"use client";

import { TransactionCard } from "@/features/shared/components";
import { Section } from "@/components/section";
import { EmptyState } from "@/components/feedback/empty-state";
import { Receipt } from "@/components/icons";
import { formatCurrency, formatRelativeTime } from "@/utils";
import type { RecentTransaction } from "../types";

interface RecentTransactionsListProps {
  transactions: RecentTransaction[];
}

/**
 * RecentTransactionsList — Shows the 5 most recent transactions on the dashboard.
 *
 * Reuses the shared TransactionCard component.
 * Falls back to EmptyState when no transactions exist.
 */
export function RecentTransactionsList({
  transactions,
}: RecentTransactionsListProps) {
  if (transactions.length === 0) {
    return (
      <Section title="Recent Transactions">
        <EmptyState
          compact
          icon={<Receipt className="size-6 text-primary" />}
          title="No Transactions Yet"
          description="Your recent visit transactions will appear here."
        />
      </Section>
    );
  }

  return (
    <Section title="Recent Transactions">
      <div className="flex flex-col gap-2">
        {transactions.map((tx) => (
          <TransactionCard
            key={tx.id}
            customerName={tx.customerName || tx.customerPhone}
            finalPaid={formatCurrency(tx.finalPaidPaise)}
            rewardUsed={
              tx.rewardUsedPaise > 0
                ? formatCurrency(tx.rewardUsedPaise)
                : undefined
            }
            paymentMethod={tx.paymentMethod}
            timestamp={formatRelativeTime(tx.createdAt)}
          />
        ))}
      </div>
    </Section>
  );
}

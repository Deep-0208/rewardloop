"use client";

import {
  KpiGrid,
  RecentTransactionsList,
  PendingSyncBadge,
} from "@/features/dashboard/components";
import type {
  DashboardKpis,
  RecentTransaction,
} from "@/features/dashboard/types";
import { formatCurrency } from "@/utils";

interface DashboardContentProps {
  kpis: DashboardKpis;
  recentTransactions: RecentTransaction[];
  totalCustomers: number;
  lifetimeRevenuePaise: number;
}

export function DashboardContent({
  kpis,
  recentTransactions,
  totalCustomers,
  lifetimeRevenuePaise,
}: DashboardContentProps) {
  return (
    <>
      <KpiGrid kpis={kpis} />
      <PendingSyncBadge />

      {/* Today's Summary */}
      <section
        className="px-[var(--spacing-md)] mt-[var(--spacing-sm)] animate-fade-in"
        style={{ animationDelay: "75ms" }}
        aria-label="Today's summary"
      >
        <div className="bg-card rounded-[var(--radius-card)] shadow-[var(--shadow-card)] px-[var(--spacing-md)] py-[var(--spacing-sm)] flex items-center justify-around">
          <SummaryItem value={String(kpis.todayTransactions)} label="Visits" />
          <div className="w-px h-[28px] bg-border/40" />
          <SummaryItem value={String(totalCustomers)} label="Customers" />
          <div className="w-px h-[28px] bg-border/40" />
          <SummaryItem
            value={formatCurrency(lifetimeRevenuePaise)}
            label="Lifetime"
          />
        </div>
      </section>

      <RecentTransactionsList transactions={recentTransactions} />
    </>
  );
}

function SummaryItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-[2px]">
      <span className="text-[16px] font-bold text-[var(--color-text-primary)] tabular-nums leading-none">
        {value}
      </span>
      <span className="text-[11px] font-medium text-[var(--color-text-tertiary)] leading-none">
        {label}
      </span>
    </div>
  );
}

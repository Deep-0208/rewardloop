"use client";

import {
  KpiGrid,
  RecentTransactionsList,
  QuickActions,
} from "@/features/dashboard/components";
import { Section } from "@/components/section";
import type {
  DashboardKpis,
  RecentTransaction,
} from "@/features/dashboard/types";

interface DashboardContentProps {
  kpis: DashboardKpis;
  recentTransactions: RecentTransaction[];
}

/**
 * DashboardContent — Client-side interactive wrapper.
 *
 * Receives server-fetched data as props and renders
 * the KPI grid, quick actions, and recent transactions.
 */
export function DashboardContent({
  kpis,
  recentTransactions,
}: DashboardContentProps) {
  return (
    <>
      <KpiGrid kpis={kpis} />

      <Section title="Quick Actions">
        <QuickActions />
      </Section>

      <RecentTransactionsList transactions={recentTransactions} />
    </>
  );
}

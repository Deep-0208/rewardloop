"use client";

import { StatCard } from "@/features/shared/components";
import { IndianRupee, Receipt, Users, Gift } from "@/components/icons";
import { formatCurrency } from "@/utils";
import type { DashboardKpis } from "../types";

interface KpiGridProps {
  kpis: DashboardKpis;
}

/**
 * KpiGrid — 2x2 grid of KPI stat cards for the dashboard.
 *
 * Reuses the existing shared StatCard component.
 * All monetary values converted from paise via formatCurrency.
 */
export function KpiGrid({ kpis }: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Today's Revenue"
        value={formatCurrency(kpis.todayRevenuePaise)}
        icon={IndianRupee}
        accentColor="bg-emerald-500/10 text-emerald-600"
      />
      <StatCard
        label="Transactions"
        value={String(kpis.todayTransactions)}
        icon={Receipt}
        accentColor="bg-blue-500/10 text-blue-600"
      />
      <StatCard
        label="Customers Today"
        value={String(kpis.todayCustomers)}
        icon={Users}
        accentColor="bg-violet-500/10 text-violet-600"
      />
      <StatCard
        label="Rewards Used"
        value={formatCurrency(kpis.todayRewardsRedeemedPaise)}
        icon={Gift}
        accentColor="bg-amber-500/10 text-amber-600"
      />
    </div>
  );
}

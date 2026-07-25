import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { getDashboardData } from "@/features/dashboard/actions/get-dashboard-data";
import { DashboardContent } from "./dashboard-content";
import { formatCurrency } from "@/utils";
import { Users, IndianRupee } from "@/components/icons";

/**
 * Dashboard page — Merchant home view.
 *
 * Server component that fetches KPIs, recent transactions,
 * and aggregate stats. Renders the full operational dashboard.
 */
export default async function DashboardPage() {
  const result = await getDashboardData();

  if (!result.success) {
    return (
      <ScreenContainer>
        <PageHeader title="Dashboard" />
        <Section>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Unable to load dashboard. Please try again.
            </p>
          </div>
        </Section>
      </ScreenContainer>
    );
  }

  const { kpis, recentTransactions, totalCustomers, lifetimeRevenuePaise } =
    result.data;

  return (
    <ScreenContainer>
      <PageHeader title="Dashboard" subtitle="Today's overview" />

      <DashboardContent kpis={kpis} recentTransactions={recentTransactions} />

      {/* Lifetime stats footer */}
      <div className="flex items-center justify-between rounded-[var(--radius-card)] bg-card border shadow-[var(--shadow-card)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {totalCustomers} total customers
          </span>
        </div>
        <div className="flex items-center gap-2">
          <IndianRupee className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            {formatCurrency(lifetimeRevenuePaise)} lifetime
          </span>
        </div>
      </div>
    </ScreenContainer>
  );
}

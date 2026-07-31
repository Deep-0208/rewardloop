import { getDashboardData } from "@/features/dashboard/actions/get-dashboard-data";
import { DashboardContent } from "./dashboard-content";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/ui/feedback-states";

function getGreeting(): string {
  // Try to get greeting based on IST (or default to something reasonable if no tz available)
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Dashboard page — Merchant home view.
 *
 * Server component that fetches KPIs, recent transactions,
 * and aggregate stats. Renders the full operational dashboard.
 */
export default async function DashboardPage() {
  const result = await getDashboardData();
  const greeting = getGreeting();

  if (!result.success) {
    return (
      <div className="flex flex-1 flex-col pb-28">
        <PageHeader
          title="Dashboard"
          subtitle={`${greeting} 👋`}
        />
        <ErrorState
          title="Unable to load dashboard"
          description="Please check your connection and try again."
        />
      </div>
    );
  }

  const {
    kpis,
    recentTransactions,
    totalCustomers,
    lifetimeRevenuePaise,
    businessName,
  } = result.data;

  const todayStr = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="flex-1 flex flex-col pb-28">
      {/* Header */}
      <PageHeader
        title={businessName}
        subtitle={`${greeting} 👋`}
        actions={
          <div className="rounded-lg bg-muted/60 px-3 py-1.5">
            <p className="text-[12px] font-semibold text-foreground tabular-nums">
              {todayStr}
            </p>
          </div>
        }
      />

      {/* Main Content */}
      <DashboardContent
        kpis={kpis}
        recentTransactions={recentTransactions}
        totalCustomers={totalCustomers}
        lifetimeRevenuePaise={lifetimeRevenuePaise}
      />
    </div>
  );
}

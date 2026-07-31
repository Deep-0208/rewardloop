import { getDashboardData } from "@/features/dashboard/actions/get-dashboard-data";
import { DashboardContent } from "./dashboard-content";

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
      <div className="flex flex-1 flex-col pb-[100px]">
        <header className="px-6 pt-12 pb-4">
          <p className="text-[13px] font-medium text-muted-foreground mb-[2px]">
            {greeting} 👋
          </p>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">
            Dashboard
          </h1>
        </header>
        <div className="px-6">
          <div className="bg-destructive/10 rounded-[var(--radius-card)] p-4 text-center">
            <p className="text-sm font-medium text-destructive">
              Unable to load dashboard data. Please try again.
            </p>
          </div>
        </div>
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
    <div className="flex-1 flex flex-col pb-[100px]">
      {/* Header */}
      <header className="px-5 pt-8 pb-4 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-medium text-muted-foreground mb-0.5">
              {greeting} 👋
            </p>
            <h1 className="text-[24px] font-bold tracking-tight text-foreground leading-tight line-clamp-1">
              {businessName}
            </h1>
          </div>
          <div className="text-right mt-1 shrink-0 ml-4 rounded-lg bg-muted/60 px-3 py-1.5">
            <p className="text-[12px] font-semibold text-foreground tabular-nums">
              {todayStr}
            </p>
          </div>
        </div>
      </header>

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

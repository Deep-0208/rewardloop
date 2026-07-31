import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { StatCard } from "@/features/shared/components";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { getInsights } from "@/features/insights/actions/get-insights";
import { formatCurrency } from "@/utils";
import {
  IndianRupee,
  Receipt,
  Users,
  Gift,
  Percent,
  Star,
  Scissors,
} from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Returns a styling string for the rank indicator based on the index (0-based).
 * Top 3 get gold, silver, bronze styles. The rest get a subtle muted style.
 */
function getRankStyle(index: number) {
  switch (index) {
    case 0:
      return "bg-amber-500/15 text-amber-600 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]";
    case 1:
      return "bg-slate-400/15 text-slate-500 border border-slate-400/30 shadow-[0_0_12px_rgba(148,163,184,0.15)]";
    case 2:
      return "bg-amber-700/10 text-amber-700 border border-amber-700/20 shadow-[0_0_12px_rgba(180,83,9,0.1)]";
    default:
      return "bg-muted/50 text-muted-foreground border border-transparent";
  }
}

/**
 * Calculates the redemption rate as a formatted percentage string.
 */
function calculateRedemptionRate(earned: number, redeemed: number): string {
  if (earned <= 0) return "0%";
  return ((redeemed / earned) * 100).toFixed(1) + "%";
}

/**
 * Insights page — Business analytics overview.
 *
 * Server component displaying lifetime stats, top services, and top customers.
 */
export default async function InsightsPage() {
  const result = await getInsights();

  if (!result.success) {
    return (
      <ScreenContainer>
        <PageHeader title="Insights" />
        <ErrorState
          title="Unable to load insights"
          description="Please check your connection and try again."
        />
      </ScreenContainer>
    );
  }

  const { overview, topServices, topCustomers } = result.data;

  const redemptionRate = calculateRedemptionRate(
    overview.totalRewardsEarnedPaise,
    overview.totalRewardsRedeemedPaise
  );

  return (
    <ScreenContainer>
      <PageHeader title="Insights" subtitle="Business analytics" />

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(overview.totalRevenuePaise)}
          icon={IndianRupee}
          accentColor="bg-[var(--color-success)]/10 text-[var(--color-success)]"
        />
        <StatCard
          label="Transactions"
          value={String(overview.totalTransactions)}
          icon={Receipt}
          accentColor="bg-violet-600/10 text-violet-600"
        />
        <StatCard
          label="Customers"
          value={String(overview.totalCustomers)}
          icon={Users}
          accentColor="bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
        />
        <StatCard
          label="Redemption Rate"
          value={redemptionRate}
          icon={Percent}
          accentColor="bg-primary/10 text-primary"
        />
      </div>

      {/* Rewards summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          label="Rewards Given"
          value={formatCurrency(overview.totalRewardsEarnedPaise)}
          icon={Gift}
          accentColor="bg-sky-600/10 text-sky-600"
        />
        <StatCard
          label="Rewards Redeemed"
          value={formatCurrency(overview.totalRewardsRedeemedPaise)}
          icon={Star}
          accentColor="bg-rose-500/10 text-rose-500"
        />
      </div>

      {/* Top Items */}
      <Section title="Top Items" description="Most popular by quantity sold">
        {topServices.length === 0 ? (
          <EmptyState
            compact
            icon={<Scissors className="size-6 text-primary" />}
            title="No Services Yet"
            description="Service rankings appear after completing transactions."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {topServices.map((service, index) => (
              <Card 
                key={service.name} 
                className="group transition-all duration-200 hover:shadow-md hover:border-border/80 border-border/50 bg-gradient-to-r from-card to-card/50"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-transform duration-300 group-hover:scale-105 ${getRankStyle(index)}`}>
                    #{index + 1}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-bold text-foreground truncate">
                      {service.name}
                    </span>
                    <span className="text-[12px] font-medium text-muted-foreground truncate">
                      {service.totalQuantity}{" "}
                      {service.totalQuantity === 1 ? "sale" : "sales"}
                    </span>
                  </div>
                  <span className="text-[15px] font-bold tabular-nums text-foreground shrink-0 pl-2">
                    {formatCurrency(service.totalRevenuePaise)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Top Customers */}
      <Section title="Top Customers" description="Most frequent visitors">
        {topCustomers.length === 0 ? (
          <EmptyState
            compact
            icon={<Users className="size-6 text-primary" />}
            title="No Customers Yet"
            description="Customer rankings appear after recording visits."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {topCustomers.map((customer, index) => (
              <Card 
                key={customer.id} 
                className="group transition-all duration-200 hover:shadow-md hover:border-border/80 border-border/50 bg-gradient-to-r from-card to-card/50"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-transform duration-300 group-hover:scale-105 ${getRankStyle(index)}`}>
                    #{index + 1}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-bold text-foreground truncate">
                      {customer.name || customer.phone}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px] font-medium text-muted-foreground">
                        {customer.totalVisits}{" "}
                        {customer.totalVisits === 1 ? "visit" : "visits"}
                      </span>
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-semibold bg-primary/10 text-primary border-primary/20"
                      >
                        {formatCurrency(customer.totalSpentPaise)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </ScreenContainer>
  );
}

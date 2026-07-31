import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { StatCard } from "@/features/shared/components";
import { EmptyState } from "@/components/feedback/empty-state";
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
        <Section>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Unable to load insights. Please try again.
            </p>
          </div>
        </Section>
      </ScreenContainer>
    );
  }

  const { overview, topServices, topCustomers } = result.data;

  const redemptionRate =
    overview.totalRewardsEarnedPaise > 0
      ? (
          (overview.totalRewardsRedeemedPaise /
            overview.totalRewardsEarnedPaise) *
          100
        ).toFixed(1) + "%"
      : "0%";

  return (
    <ScreenContainer>
      <PageHeader title="Insights" subtitle="Business analytics" />

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 gap-3">
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
          accentColor="bg-primary/10 text-primary"
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
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Rewards Given"
          value={formatCurrency(overview.totalRewardsEarnedPaise)}
          icon={Gift}
          accentColor="bg-[var(--color-success)]/10 text-[var(--color-success)]"
        />
        <StatCard
          label="Rewards Redeemed"
          value={formatCurrency(overview.totalRewardsRedeemedPaise)}
          icon={Star}
          accentColor="bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]"
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
          <div className="flex flex-col gap-2">
            {topServices.map((service, index) => (
              <Card key={service.name} className="">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {service.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {service.totalQuantity}{" "}
                      {service.totalQuantity === 1 ? "sale" : "sales"}
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
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
          <div className="flex flex-col gap-2">
            {topCustomers.map((customer, index) => (
              <Card key={customer.id} className="">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {customer.name || customer.phone}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {customer.totalVisits}{" "}
                        {customer.totalVisits === 1 ? "visit" : "visits"}
                      </span>
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-medium"
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

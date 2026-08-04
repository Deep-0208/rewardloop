import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { getSettings } from "@/features/settings/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/feedback-states";
import {
  Store,
  Scissors,
  Gift,
  Users,
  ChevronRight,
  Info,
} from "@/components/icons";
import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { FullscreenToggle } from "@/components/fullscreen-toggle";
import { RewardLoopLogo } from "@/components/brand";

/**
 * More/Settings page — Business configuration hub.
 *
 * Server component displaying business profile, navigation to catalog
 * management, reward rules, and account actions.
 */
export default async function MorePage() {
  const result = await getSettings();

  if (!result.success) {
    return (
      <ScreenContainer>
        <PageHeader title="Settings" />
        <ErrorState
          title="Unable to load settings"
          description="Please check your connection and try again."
        />
      </ScreenContainer>
    );
  }

  const { profile, rewardRules, catalogItemCount, customerCount } = result.data;

  return (
    <ScreenContainer>
      <PageHeader
        title="Settings"
        subtitle="Manage store profile, catalog & loyalty rules"
      />

      {/* Business Profile Card */}
      <Link href="/more/profile" className="group block outline-none mb-2">
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent transition-all duration-300 hover:shadow-md hover:border-primary/30 active:scale-[0.98]">
          {/* Decorative background glow */}
          <div className="absolute -right-6 -top-6 size-32 rounded-full bg-primary/5 blur-2xl transition-all duration-300 group-hover:bg-primary/10" />

          <CardContent className="relative flex items-center gap-4 p-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
              <Store className="size-7" />
            </div>
            <div className="flex flex-1 flex-col min-w-0">
              <span className="text-lg font-bold text-foreground truncate tracking-tight">
                {profile.name}
              </span>
              <span className="text-[13px] capitalize text-muted-foreground truncate font-medium">
                {profile.businessType.replaceAll("_", " ")}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <Badge
                variant="secondary"
                className="capitalize bg-background/50 backdrop-blur-sm border-border/50"
              >
                Owner
              </Badge>
              <ChevronRight className="size-4 text-muted-foreground/60 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Quick Stats */}
      <Section title="Overview">
        <div className="grid grid-cols-2 gap-3">
          <Card className="transition-all duration-200 hover:shadow-sm border-border/50 bg-gradient-to-b from-card to-card/50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/10 text-violet-600">
                <Users className="size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-bold tabular-nums text-foreground leading-none tracking-tight">
                  {customerCount}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground mt-1.5 truncate uppercase tracking-wider">
                  Customers
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:shadow-sm border-border/50 bg-gradient-to-b from-card to-card/50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Scissors className="size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-bold tabular-nums text-foreground leading-none tracking-tight">
                  {catalogItemCount}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground mt-1.5 truncate uppercase tracking-wider">
                  Catalog Items
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Management Menu */}
      <Section title="Manage">
        <Card className="overflow-hidden border-border/50 shadow-sm">
          <CardContent className="p-0 flex flex-col divide-y divide-border/40">
            <SettingsMenuItem
              href="/more/catalog"
              icon={<Scissors className="size-5" />}
              iconWrapperClassName="bg-primary/10 text-primary"
              label="Catalog"
              description={`${catalogItemCount} item${catalogItemCount !== 1 ? "s" : ""}`}
            />
            <SettingsMenuItem
              href="/more/rewards"
              icon={<Gift className="size-5" />}
              iconWrapperClassName="bg-amber-500/10 text-amber-600"
              label="Reward Rules"
              description={
                rewardRules
                  ? `${rewardRules.rewardPercentage}% earn · ${rewardRules.maxRedeemPercentage}% max redeem`
                  : "Not configured"
              }
            />
          </CardContent>
        </Card>
      </Section>

      {/* Display & Fullscreen */}
      <Section title="Display & App Mode">
        <Card className="overflow-hidden border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                Full Screen View
              </span>
              <span className="text-[12px] text-muted-foreground">
                Hide Chrome address bar while using
              </span>
            </div>
            <FullscreenToggle />
          </CardContent>
        </Card>
      </Section>

      {/* Legal Menu */}
      <Section title="Legal">
        <Card className="overflow-hidden border-border/50 shadow-sm">
          <CardContent className="p-0 flex flex-col divide-y divide-border/40">
            <SettingsMenuItem
              href="/terms"
              icon={<Info className="size-5" />}
              iconWrapperClassName="bg-slate-500/10 text-slate-500"
              label="Terms of Service"
            />
            <SettingsMenuItem
              href="/privacy"
              icon={<Info className="size-5" />}
              iconWrapperClassName="bg-slate-500/10 text-slate-500"
              label="Privacy Policy"
            />
          </CardContent>
        </Card>
      </Section>

      {/* Account Actions */}
      <Section title="Account">
        <Card className="overflow-hidden border-border/50 shadow-sm">
          <CardContent className="p-0 flex flex-col">
            <LogoutButton />
          </CardContent>
        </Card>
      </Section>

      {/* Official Brand Footer */}
      <div className="flex flex-col items-center justify-center pt-8 pb-6 gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
        <RewardLoopLogo variant="horizontal" size="sm" />
        <span className="text-[11px] font-medium text-muted-foreground">
          RewardLoop v1.0 • Retention Engine
        </span>
      </div>
    </ScreenContainer>
  );
}

/** A single menu item in the settings list. */
function SettingsMenuItem({
  href,
  icon,
  iconWrapperClassName = "bg-muted text-foreground",
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  iconWrapperClassName?: string;
  label: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 p-4 transition-colors duration-200 hover:bg-muted/30 active:bg-muted/50 outline-none"
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${iconWrapperClassName}`}
      >
        {icon}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">
          {label}
        </span>
        {description && (
          <span className="text-[12px] font-medium text-muted-foreground truncate">
            {description}
          </span>
        )}
      </div>
      <ChevronRight className="size-4 text-muted-foreground/40 shrink-0 ml-2 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-muted-foreground/80" />
    </Link>
  );
}

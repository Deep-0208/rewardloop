import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { getSettings } from "@/features/settings/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <Section>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Unable to load settings. Please try again.
            </p>
          </div>
        </Section>
      </ScreenContainer>
    );
  }

  const { profile, rewardRules, catalogItemCount, customerCount } = result.data;

  return (
    <ScreenContainer>
      <PageHeader title="Settings" />

      {/* Business Profile Card */}
      <Link href="/more/profile" className="block outline-none">
        <Card className="transition-all duration-150 hover:shadow-[var(--shadow-soft)] active:scale-[0.98]">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Store className="size-6" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground">
                {profile.name}
              </span>
              <span className="text-xs capitalize text-muted-foreground">
                {profile.businessType.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                Owner
              </Badge>
              <ChevronRight className="size-4 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Management Menu */}
      <Section title="Manage">
        <Card className="overflow-hidden">
          <CardContent className="p-0 flex flex-col divide-y divide-border/40">
            <SettingsMenuItem
              href="/more/catalog"
              icon={<Scissors className="size-5 text-primary" />}
              label="Catalog"
              description={`${catalogItemCount} item${catalogItemCount !== 1 ? "s" : ""}`}
            />
            <SettingsMenuItem
              href="/more/rewards"
              icon={<Gift className="size-5 text-amber-600" />}
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

      {/* Quick Stats */}
      <Section title="Overview">
        <div className="grid grid-cols-2 gap-3">
          <Card className="">
            <CardContent className="flex flex-col items-center gap-1.5 p-4">
              <Users className="size-5 text-violet-600" />
              <span className="text-xl font-bold tabular-nums text-foreground">
                {customerCount}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Customers
              </span>
            </CardContent>
          </Card>
          <Card className="">
            <CardContent className="flex flex-col items-center gap-1.5 p-4">
              <Scissors className="size-5 text-primary" />
              <span className="text-xl font-bold tabular-nums text-foreground">
                {catalogItemCount}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Catalog Items
              </span>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Legal Menu */}
      <Section title="Legal">
        <Card className="overflow-hidden">
          <CardContent className="p-0 flex flex-col divide-y divide-border/40">
            <SettingsMenuItem
              href="/terms"
              icon={<Info className="size-5 text-slate-500" />}
              label="Terms of Service"
            />
            <SettingsMenuItem
              href="/privacy"
              icon={<Info className="size-5 text-slate-500" />}
              label="Privacy Policy"
            />
          </CardContent>
        </Card>
      </Section>

      {/* Account Actions */}
      <Section title="Account">
        <Card className="overflow-hidden">
          <CardContent className="p-0 flex flex-col divide-y divide-border/40">
            <LogoutButton />
          </CardContent>
        </Card>
      </Section>
    </ScreenContainer>
  );
}

/** A single menu item in the settings list. */
function SettingsMenuItem({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 transition-colors duration-150 hover:bg-muted/50 active:bg-muted outline-none"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted shrink-0">
        {icon}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {label}
        </span>
        {description && (
          <span className="text-[12px] text-muted-foreground truncate">
            {description}
          </span>
        )}
      </div>
      <ChevronRight className="size-4 text-muted-foreground/60 shrink-0 ml-2" />
    </Link>
  );
}

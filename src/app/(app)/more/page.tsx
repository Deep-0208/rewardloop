import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { getSettings } from "@/features/settings/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Scissors, Gift, Users, ChevronRight } from "@/components/icons";
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
      <Card className="border-0 shadow-[var(--shadow-card)]">
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
          <Badge variant="secondary" className="capitalize">
            Owner
          </Badge>
        </CardContent>
      </Card>

      {/* Management Menu */}
      <Section title="Manage">
        <div className="flex flex-col gap-1">
          <SettingsMenuItem
            href="/more/catalog"
            icon={<Scissors className="size-5 text-primary" />}
            label="Service Catalog"
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
        </div>
      </Section>

      {/* Quick Stats */}
      <Section title="Overview">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-[var(--shadow-card)]">
            <CardContent className="flex flex-col items-center gap-1.5 p-4">
              <Users className="size-5 text-violet-600" />
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {customerCount}
              </span>
              <span className="text-xs text-muted-foreground">Customers</span>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-[var(--shadow-card)]">
            <CardContent className="flex flex-col items-center gap-1.5 p-4">
              <Scissors className="size-5 text-primary" />
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {catalogItemCount}
              </span>
              <span className="text-xs text-muted-foreground">
                Catalog Items
              </span>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Account Actions */}
      <Section title="Account">
        <LogoutButton />
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
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="border-0 shadow-[var(--shadow-card)] transition-all duration-150 hover:shadow-[var(--shadow-soft)] active:scale-[0.98]">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
            {icon}
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

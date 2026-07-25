import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { getRewardRules } from "@/features/settings/actions";
import { RewardRulesContent } from "./rewards-content";

/**
 * Reward Rules page — Configure earn/redeem percentages.
 *
 * Server component that fetches current reward rules
 * and passes them to the interactive client component.
 */
export default async function RewardRulesPage() {
  const result = await getRewardRules();

  if (!result.success) {
    return (
      <ScreenContainer>
        <PageHeader title="Reward Rules" />
        <Section>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Unable to load reward rules. Please try again.
            </p>
          </div>
        </Section>
      </ScreenContainer>
    );
  }

  return <RewardRulesContent initialRules={result.data} />;
}

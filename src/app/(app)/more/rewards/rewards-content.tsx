"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Percent, Check, Loader2 } from "@/components/icons";
import posthog from "posthog-js";
import { updateRewardRules } from "@/features/settings/actions";
import type { RewardRulesConfig } from "@/features/settings/types";
import { toast } from "sonner";

interface RewardRulesContentProps {
  initialRules: RewardRulesConfig;
}

/**
 * RewardRulesContent — Interactive reward rules editor.
 *
 * Allows updating reward earn percentage and max redeem percentage.
 */
export function RewardRulesContent({ initialRules }: RewardRulesContentProps) {
  const router = useRouter();
  const [rewardPercentage, setRewardPercentage] = useState(
    String(initialRules.rewardPercentage),
  );
  const [maxRedeemPercentage, setMaxRedeemPercentage] = useState(
    String(initialRules.maxRedeemPercentage),
  );
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    Number(rewardPercentage) !== initialRules.rewardPercentage ||
    Number(maxRedeemPercentage) !== initialRules.maxRedeemPercentage;

  const handleSave = () => {
    const rp = Number(rewardPercentage);
    const mrp = Number(maxRedeemPercentage);

    if (rp < 1 || rp > 50 || mrp < 1 || mrp > 50) {
      toast.error("Percentages must be between 1 and 50.");
      return;
    }

    startTransition(async () => {
      const result = await updateRewardRules({
        rewardPercentage: rp,
        maxRedeemPercentage: mrp,
      });
      if (result.success) {
        posthog.capture("reward_rules_updated", {
          reward_percentage: rp,
          max_redeem_percentage: mrp,
        });
        toast.success("Reward rules updated successfully.");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <ScreenContainer>
      <PageHeader
        title="Reward Rules"
        subtitle="Configure loyalty program"
        onBack={() => router.push("/more")}
      />

      {/* Current Rules Display */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Gift className="size-6" />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">
              Active Reward Program
            </span>
            <span className="text-xs text-muted-foreground">
              Customers earn {initialRules.rewardPercentage}% on every visit
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Section title="Configuration">
        <div className="flex flex-col gap-4">
          <Card className="border border-border">
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="reward-pct" className="flex items-center gap-2">
                  <Percent className="size-4 text-muted-foreground" />
                  Reward Earn Rate
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="reward-pct"
                    type="number"
                    min="1"
                    max="50"
                    value={rewardPercentage}
                    onChange={(e) => setRewardPercentage(e.target.value)}
                    className="w-24 text-center tabular-nums"
                  />
                  <span className="text-sm text-muted-foreground">
                    % of final paid → customer wallet
                  </span>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="max-redeem-pct"
                  className="flex items-center gap-2"
                >
                  <Percent className="size-4 text-muted-foreground" />
                  Max Redemption Cap
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="max-redeem-pct"
                    type="number"
                    min="1"
                    max="50"
                    value={maxRedeemPercentage}
                    onChange={(e) => setMaxRedeemPercentage(e.target.value)}
                    className="w-24 text-center tabular-nums"
                  />
                  <span className="text-sm text-muted-foreground">
                    % of subtotal redeemable per visit
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="h-12 rounded-xl font-semibold shadow-md"
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Check className="mr-2 size-4" />
            )}
            Save Changes
          </Button>
        </div>
      </Section>

      {/* Help Text */}
      <div className="rounded-2xl bg-muted/50 px-4 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>How it works:</strong> After each visit, the customer earns{" "}
          <strong>{rewardPercentage}%</strong> of the amount they paid as reward
          points. On their next visit, they can redeem up to{" "}
          <strong>{maxRedeemPercentage}%</strong> of the bill subtotal using
          their accumulated rewards.
        </p>
      </div>
    </ScreenContainer>
  );
}

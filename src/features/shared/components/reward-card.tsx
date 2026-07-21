import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Gift } from "@/components/icons";

interface RewardCardProps {
  /** Available reward balance display (e.g., "₹500") */
  availableBalance: string;
  /** Maximum redeemable display (e.g., "₹200") */
  maxRedeem?: string;
  /** Applied reward display (e.g., "₹150") */
  appliedAmount?: string;
  /** Final pay after reward display (e.g., "₹850") */
  finalPay?: string;
  className?: string;
}

/**
 * RewardCard — Reward summary card for billing flow.
 *
 * Displays available balance, max redeem, applied, and final pay.
 * Source: 09_UI_UX_Specification §10 — Component Library (RewardSummaryCard)
 */
export function RewardCard({
  availableBalance,
  maxRedeem,
  appliedAmount,
  finalPay,
  className,
}: RewardCardProps) {
  return (
    <Card className={cn("border border-border", className)}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)]">
            <Gift className="size-4" />
          </div>
          <span className="text-sm font-medium text-foreground">
            Reward Points
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Available</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {availableBalance}
            </span>
          </div>
          {maxRedeem ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Max Redeem</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {maxRedeem}
              </span>
            </div>
          ) : null}
          {appliedAmount ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Reward Used</span>
              <span className="text-sm font-semibold tabular-nums text-[var(--color-success)]">
                -{appliedAmount}
              </span>
            </div>
          ) : null}
          {finalPay ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Final Pay</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {finalPay}
              </span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

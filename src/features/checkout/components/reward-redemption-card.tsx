import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Wallet } from "@/components/icons";
import { EmptyState } from "@/components/ui/feedback-states";
import { formatCurrency } from "@/utils";
import { sanitizeRupeeInput } from "@/features/reward/utils/reward-input";

export interface RewardRedemptionCardProps {
  walletBalancePaise: number;
  maxRedeemPaise: number;
  rewardInput: string;
  onRewardInputChange: (value: string) => void;
  onBlur: () => void;
}

export function RewardRedemptionCard({
  walletBalancePaise,
  maxRedeemPaise,
  rewardInput,
  onRewardInputChange,
  onBlur,
}: RewardRedemptionCardProps) {
  const inputError = useMemo(() => {
    try {
      const val = parseFloat(rewardInput || "0") * 100;
      if (val === 0) return null;
      if (val < 100) return "Minimum redemption is ₹1.";
      if (val > maxRedeemPaise) {
        return `This will be limited to ${formatCurrency(maxRedeemPaise)}.`;
      }
      return null;
    } catch {
      return null;
    }
  }, [rewardInput, maxRedeemPaise]);

  return (
    <div className="bg-card rounded-[var(--radius-card)] p-[var(--spacing-md)] mb-[var(--spacing-sm)] shadow-sm border border-border/40 relative overflow-hidden">
      <div className="flex flex-col gap-[var(--spacing-md)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-[var(--spacing-s)]">
            <div className="w-[36px] h-[36px] rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Wallet className="size-4" />
            </div>
            <div>
              <p className="font-semibold text-[15px] text-[var(--color-text-primary)]">
                Available Rewards
              </p>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-[2px]">
                Balance: {formatCurrency(walletBalancePaise)} • Max:{" "}
                {formatCurrency(maxRedeemPaise)}
              </p>
            </div>
          </div>
        </div>

        {walletBalancePaise === 0 ? (
          <EmptyState
            variant="inline"
            icon={Wallet}
            title="Customer has no rewards"
            description="They will earn rewards from this visit after payment."
            className="rounded-[var(--radius-card)] border bg-card/50"
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative group">
              <Label htmlFor="reward-amount" className="sr-only">
                Reward amount in rupees
              </Label>
              <div className="absolute left-[16px] top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-[16px]" aria-hidden="true">
                ₹
              </div>
              <input
                id="reward-amount"
                type="text"
                inputMode="decimal"
                placeholder="0"
                aria-label="Reward amount in rupees"
                aria-describedby={inputError ? "reward-amount-error" : undefined}
                aria-invalid={inputError ? true : undefined}
                value={rewardInput}
                onChange={(event) => {
                  let val = event.target.value;
                  if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                    val = val.replace(/^0+/, "");
                    if (val === "") val = "0";
                  }
                  onRewardInputChange(sanitizeRupeeInput(val));
                }}
                onFocus={(e) => e.target.select()}
                onBlur={onBlur}
                className="w-full h-12 pl-[36px] pr-[16px] bg-muted/30 border border-border/60 hover:border-border focus:border-primary focus:ring-[3px] focus:ring-primary/10 rounded-[var(--radius-input)] text-[24px] font-semibold text-right text-[var(--color-text-primary)] outline-none transition-all tabular-nums"
              />
            </div>

            {inputError && (
              <p id="reward-amount-error" className="text-[12px] text-destructive font-medium px-1" role="alert">
                {inputError}
              </p>
            )}

            <div className="flex items-center bg-muted/50 p-1 rounded-[16px] border border-border/40 gap-1">
              {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
                const chipPaise = Math.floor(maxRedeemPaise * ratio);
                const chipRupees = (chipPaise / 100).toString();
                const label = ratio === 1.0 ? "Max" : `${ratio * 100}%`;
                const isActive =
                  rewardInput === chipRupees &&
                  rewardInput !== "" &&
                  rewardInput !== "0";
                return (
                  <button
                    key={ratio}
                    type="button"
                    aria-pressed={isActive}
                    className={`h-[36px] flex-1 rounded-[12px] text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActive ? "bg-background shadow-[var(--shadow-sm)] text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => onRewardInputChange(chipRupees)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { calculateBill } from "@/lib/billing/billing-math";
import type { CartItem } from "@/stores/billing-store";
import type { Paise } from "@/types";
import type { RewardSummary } from "../types";

/**
 * Fast client-side display preview. It uses only the shared billing engine;
 * final validation still occurs with fresh server values before progressing.
 */
export function createRewardPreview(
  items: readonly CartItem[],
  serverSummary: RewardSummary,
  rewardRequestedPaise: Paise,
): RewardSummary {
  const calculation = calculateBill({
    items: items.map((item) => ({
      unitPricePaise: item.unitPrice,
      quantity: item.quantity,
    })),
    walletBalancePaise: serverSummary.walletBalancePaise,
    rewardPercentage: serverSummary.rewardPercentage,
    maxRedeemPercentage: serverSummary.maxRedeemPercentage,
    rewardAppliedPaise: rewardRequestedPaise,
  });

  return {
    ...serverSummary,
    ...calculation,
    rewardRequestedPaise,
    requiresOtp: calculation.rewardAppliedPaise > 0,
  };
}

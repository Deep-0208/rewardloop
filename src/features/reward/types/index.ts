import type { ActionResult, Paise, UUID } from "@/types";

/** Cart shape accepted by reward calculation server actions. */
export interface RewardCartItemInput {
  readonly catalogItemId: UUID;
  readonly quantity: number;
}

/** Authoritative reward calculation returned to the billing workflow. */
export interface RewardSummary {
  readonly customerId: UUID;
  readonly walletBalancePaise: Paise;
  readonly newWalletBalancePaise: Paise;
  readonly rewardPercentage: number;
  readonly maxRedeemPercentage: number;
  readonly subtotalPaise: Paise;
  readonly maxRedeemPaise: Paise;
  readonly rewardRequestedPaise: Paise;
  readonly rewardAppliedPaise: Paise;
  readonly finalPaidPaise: Paise;
  readonly rewardEarnedPaise: Paise;
  readonly requiresOtp: boolean;
}

export interface RewardCalculationInput {
  readonly customerId: UUID;
  readonly items: readonly RewardCartItemInput[];
  readonly rewardRequestedPaise: Paise;
}

export interface RewardValidationResult {
  readonly valid: true;
  readonly summary: RewardSummary;
}

export type RewardSummaryResponse = ActionResult<RewardSummary>;
export type RewardValidationResponse = ActionResult<RewardValidationResult>;

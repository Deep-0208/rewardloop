import type { ActionResult, Paise, UUID } from "@/types";
import type { RewardCartItemInput } from "@/features/reward/types";
import type { VisitPaymentMethod } from "../engine/complete-visit-validation";

export interface CompleteVisitInput {
  readonly idempotencyKey: UUID;
  readonly customerId: UUID;
  readonly items: readonly RewardCartItemInput[];
  readonly rewardAppliedPaise: Paise;
  readonly paymentMethod: VisitPaymentMethod;
  readonly otpVerifiedToken: UUID | null;
}

export interface CompleteVisitResult {
  readonly transactionId: UUID;
  readonly subtotalPaise: Paise;
  readonly rewardUsedPaise: Paise;
  readonly rewardEarnedPaise: Paise;
  readonly finalPaidPaise: Paise;
  readonly walletBalancePaise: Paise;
  readonly duplicate: boolean;
}

export type CompleteVisitResponse = ActionResult<CompleteVisitResult>;

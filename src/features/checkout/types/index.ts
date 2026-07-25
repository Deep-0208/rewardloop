import type { ActionResult, Paise, UUID } from "@/types";
import type {
  RewardCalculationInput,
  RewardSummary,
} from "@/features/reward/types";

export type CheckoutItemType = "service" | "product";

/** A server-verified item displayed in the checkout review. */
export interface CheckoutLineItem {
  readonly catalogItemId: UUID;
  readonly name: string;
  readonly type: CheckoutItemType;
  readonly unitPricePaise: Paise;
  readonly quantity: number;
  readonly totalPaise: Paise;
}

/** Immutable checkout display model; all monetary properties are paise. */
export interface CheckoutSummary {
  readonly customerId: UUID;
  readonly items: readonly CheckoutLineItem[];
  readonly serviceSubtotalPaise: Paise;
  readonly productSubtotalPaise: Paise;
  readonly subtotalPaise: Paise;
  readonly rewardUsedPaise: Paise;
  readonly finalPayablePaise: Paise;
  readonly rewardEarnedPaise: Paise;
  readonly walletBalancePaise: Paise;
  readonly walletAfterVisitPaise: Paise;
  readonly requiresOtp: boolean;
  readonly reward: RewardSummary;
}

/** Checkout uses the same secure billing request as Reward Calculation. */
export type CheckoutSummaryInput = RewardCalculationInput;

export interface CheckoutSummaryValidationResult {
  readonly valid: true;
  readonly summary: CheckoutSummary;
}

export type CheckoutSummaryResponse = ActionResult<CheckoutSummary>;
export type CheckoutSummaryValidationResponse =
  ActionResult<CheckoutSummaryValidationResult>;

export type {
  CompleteVisitInput,
  CompleteVisitResponse,
  CompleteVisitResult,
} from "./complete-visit";
export type { VisitPaymentMethod } from "../engine/complete-visit-validation";

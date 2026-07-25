/**
 * RewardLoop — Checkout summary engine.
 *
 * Uses the canonical reward result for all reward and final-payable values.
 * This module only derives the itemized service/product presentation totals.
 */

import { calculateSubtotal } from "../../../lib/billing/billing-math";
import type { Paise } from "../../../types/domain";
import type { RewardSummary } from "../../reward/types";
import type { CheckoutLineItem, CheckoutSummary } from "../types";

export interface CheckoutSummaryEngineInput {
  readonly customerId: string;
  readonly items: readonly CheckoutLineItem[];
  readonly reward: RewardSummary;
}

function calculateLineTotal(unitPricePaise: Paise, quantity: number): Paise {
  return calculateSubtotal([{ unitPricePaise, quantity }]);
}

/** Build a validated itemized checkout summary without changing financial truth. */
export function calculateCheckoutSummary(
  input: CheckoutSummaryEngineInput,
): CheckoutSummary {
  if (input.items.length === 0) {
    throw new RangeError("Checkout requires at least one selected item.");
  }

  const verifiedItems = input.items.map((item) => ({
    ...item,
    totalPaise: calculateLineTotal(item.unitPricePaise, item.quantity),
  }));
  const serviceItems = verifiedItems.filter((item) => item.type === "service");
  const productItems = verifiedItems.filter((item) => item.type === "product");
  const serviceSubtotalPaise = calculateSubtotal(
    serviceItems.map((item) => ({
      unitPricePaise: item.unitPricePaise,
      quantity: item.quantity,
    })),
  );
  const productSubtotalPaise = calculateSubtotal(
    productItems.map((item) => ({
      unitPricePaise: item.unitPricePaise,
      quantity: item.quantity,
    })),
  );
  const subtotalPaise = calculateSubtotal(
    verifiedItems.map((item) => ({
      unitPricePaise: item.unitPricePaise,
      quantity: item.quantity,
    })),
  );

  if (subtotalPaise !== input.reward.subtotalPaise) {
    throw new RangeError("Checkout items do not match the reward calculation.");
  }

  return {
    customerId: input.customerId,
    items: verifiedItems,
    serviceSubtotalPaise,
    productSubtotalPaise,
    subtotalPaise,
    rewardUsedPaise: input.reward.rewardAppliedPaise,
    finalPayablePaise: input.reward.finalPaidPaise,
    rewardEarnedPaise: input.reward.rewardEarnedPaise,
    walletBalancePaise: input.reward.walletBalancePaise,
    walletAfterVisitPaise: input.reward.newWalletBalancePaise,
    requiresOtp: input.reward.requiresOtp,
    reward: input.reward,
  };
}

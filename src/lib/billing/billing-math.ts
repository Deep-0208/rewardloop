/**
 * RewardLoop — Billing math.
 *
 * The sole source of truth for reward calculation. Every monetary argument
 * and result is an integer number of paise; floating point currency values
 * are deliberately never accepted here.
 */

import type { Paise } from "@/types";

export interface BillItem {
  readonly unitPricePaise: Paise;
  readonly quantity: number;
}

export interface BillCalculationInput {
  readonly items: readonly BillItem[];
  readonly walletBalancePaise: Paise;
  readonly maxRedeemPercentage: number;
  readonly rewardPercentage: number;
  readonly rewardAppliedPaise: Paise;
}

export interface BillCalculation {
  readonly subtotalPaise: Paise;
  readonly maxRedeemPaise: Paise;
  readonly rewardAppliedPaise: Paise;
  readonly finalPaidPaise: Paise;
  readonly rewardEarnedPaise: Paise;
  readonly newWalletBalancePaise: Paise;
}

const PERCENT_BASE = 100;

function assertSafeNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

function assertPercentage(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1 || value > 50) {
    throw new RangeError(`${name} must be an integer between 1 and 50.`);
  }
}

function multiplySafely(left: number, right: number, name: string): number {
  const product = left * right;
  if (!Number.isSafeInteger(product)) {
    throw new RangeError(`${name} exceeds the supported monetary range.`);
  }
  return product;
}

/** Calculate the subtotal from line-item prices and quantities. */
export function calculateSubtotal(items: readonly BillItem[]): Paise {
  return items.reduce<Paise>((subtotal, item) => {
    assertSafeNonNegativeInteger(item.unitPricePaise, "Item price");
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw new RangeError("Item quantity must be a positive safe integer.");
    }

    const lineTotal = multiplySafely(
      item.unitPricePaise,
      item.quantity,
      "Line total",
    );
    const nextSubtotal = subtotal + lineTotal;
    assertSafeNonNegativeInteger(nextSubtotal, "Subtotal");
    return nextSubtotal;
  }, 0);
}

/**
 * Calculate the maximum redemption allowed for a bill.
 *
 * The business cap is truncated to paise. This preserves the cap without
 * introducing a fractional paise or ever rounding redemption upward.
 */
export function calculateMaxRedeem(
  subtotalPaise: Paise,
  walletBalancePaise: Paise,
  maxRedeemPercentage: number,
): Paise {
  assertSafeNonNegativeInteger(subtotalPaise, "Subtotal");
  assertSafeNonNegativeInteger(walletBalancePaise, "Wallet balance");
  assertPercentage(maxRedeemPercentage, "Maximum redeem percentage");

  const businessCapPaise = Math.floor(
    multiplySafely(subtotalPaise, maxRedeemPercentage, "Maximum redemption") /
      PERCENT_BASE,
  );

  return Math.min(subtotalPaise, walletBalancePaise, businessCapPaise);
}

/** Clamp a manually-entered reward to the legal redemption limit. */
export function clampRewardApplied(
  enteredPaise: Paise,
  maxRedeemPaise: Paise,
): Paise {
  assertSafeNonNegativeInteger(enteredPaise, "Reward amount");
  assertSafeNonNegativeInteger(maxRedeemPaise, "Maximum redeem");
  return Math.min(enteredPaise, maxRedeemPaise);
}

/** Calculate the amount payable after a reward redemption. */
export function calculateFinalPaid(
  subtotalPaise: Paise,
  rewardAppliedPaise: Paise,
): Paise {
  assertSafeNonNegativeInteger(subtotalPaise, "Subtotal");
  assertSafeNonNegativeInteger(rewardAppliedPaise, "Reward applied");
  if (rewardAppliedPaise > subtotalPaise) {
    throw new RangeError("Reward applied cannot exceed the subtotal.");
  }
  return subtotalPaise - rewardAppliedPaise;
}

/**
 * Calculate reward earned on final paid only, rounded half-up to a paise.
 */
export function calculateRewardEarned(
  finalPaidPaise: Paise,
  rewardPercentage: number,
): Paise {
  assertSafeNonNegativeInteger(finalPaidPaise, "Final paid");
  assertPercentage(rewardPercentage, "Reward percentage");

  const numerator = multiplySafely(
    finalPaidPaise,
    rewardPercentage,
    "Reward earned",
  );
  return Math.floor((numerator + PERCENT_BASE / 2) / PERCENT_BASE);
}

/** Calculate the non-negative wallet balance after a completed visit. */
export function calculateNewWalletBalance(
  currentBalancePaise: Paise,
  rewardAppliedPaise: Paise,
  rewardEarnedPaise: Paise,
): Paise {
  assertSafeNonNegativeInteger(currentBalancePaise, "Wallet balance");
  assertSafeNonNegativeInteger(rewardAppliedPaise, "Reward applied");
  assertSafeNonNegativeInteger(rewardEarnedPaise, "Reward earned");

  if (rewardAppliedPaise > currentBalancePaise) {
    throw new RangeError("Reward applied cannot exceed the wallet balance.");
  }

  const balanceAfterRedemption = currentBalancePaise - rewardAppliedPaise;
  const newBalance = balanceAfterRedemption + rewardEarnedPaise;
  assertSafeNonNegativeInteger(newBalance, "New wallet balance");
  return newBalance;
}

/** Execute the complete, ordered reward calculation pipeline. */
export function calculateBill(input: BillCalculationInput): BillCalculation {
  const subtotalPaise = calculateSubtotal(input.items);
  const maxRedeemPaise = calculateMaxRedeem(
    subtotalPaise,
    input.walletBalancePaise,
    input.maxRedeemPercentage,
  );
  const rewardAppliedPaise = clampRewardApplied(
    input.rewardAppliedPaise,
    maxRedeemPaise,
  );
  const finalPaidPaise = calculateFinalPaid(subtotalPaise, rewardAppliedPaise);
  const rewardEarnedPaise = calculateRewardEarned(
    finalPaidPaise,
    input.rewardPercentage,
  );
  const newWalletBalancePaise = calculateNewWalletBalance(
    input.walletBalancePaise,
    rewardAppliedPaise,
    rewardEarnedPaise,
  );

  return {
    subtotalPaise,
    maxRedeemPaise,
    rewardAppliedPaise,
    finalPaidPaise,
    rewardEarnedPaise,
    newWalletBalancePaise,
  };
}

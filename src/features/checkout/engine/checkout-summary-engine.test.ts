import assert from "node:assert/strict";
import test from "node:test";
import type { RewardSummary } from "../../reward/types";
import { calculateCheckoutSummary } from "./checkout-summary-engine";

function rewardSummary(overrides: Partial<RewardSummary> = {}): RewardSummary {
  return {
    customerId: "00000000-0000-0000-0000-000000000001",
    walletBalancePaise: 5_000,
    newWalletBalancePaise: 6_000,
    rewardPercentage: 10,
    maxRedeemPercentage: 20,
    subtotalPaise: 10_000,
    maxRedeemPaise: 2_000,
    rewardRequestedPaise: 0,
    rewardAppliedPaise: 0,
    finalPaidPaise: 10_000,
    rewardEarnedPaise: 1_000,
    requiresOtp: false,
    ...overrides,
  };
}

test("builds a service-only checkout summary", () => {
  const summary = calculateCheckoutSummary({
    customerId: "00000000-0000-0000-0000-000000000001",
    reward: rewardSummary(),
    items: [
      {
        catalogItemId: "00000000-0000-0000-0000-000000000010",
        name: "Haircut",
        type: "service",
        unitPricePaise: 5_000,
        quantity: 2,
        totalPaise: 0,
      },
    ],
  });

  assert.equal(summary.serviceSubtotalPaise, 10_000);
  assert.equal(summary.productSubtotalPaise, 0);
  assert.equal(summary.finalPayablePaise, 10_000);
});

test("separates product and service subtotals for a mixed cart", () => {
  const summary = calculateCheckoutSummary({
    customerId: "00000000-0000-0000-0000-000000000001",
    reward: rewardSummary({
      subtotalPaise: 15_000,
      rewardAppliedPaise: 1_500,
      finalPaidPaise: 13_500,
      rewardEarnedPaise: 1_350,
      newWalletBalancePaise: 4_850,
      requiresOtp: true,
    }),
    items: [
      {
        catalogItemId: "00000000-0000-0000-0000-000000000010",
        name: "Haircut",
        type: "service",
        unitPricePaise: 10_000,
        quantity: 1,
        totalPaise: 0,
      },
      {
        catalogItemId: "00000000-0000-0000-0000-000000000011",
        name: "Shampoo",
        type: "product",
        unitPricePaise: 2_500,
        quantity: 2,
        totalPaise: 0,
      },
    ],
  });

  assert.equal(summary.serviceSubtotalPaise, 10_000);
  assert.equal(summary.productSubtotalPaise, 5_000);
  assert.equal(summary.rewardUsedPaise, 1_500);
  assert.equal(summary.finalPayablePaise, 13_500);
  assert.equal(summary.walletAfterVisitPaise, 4_850);
  assert.equal(summary.requiresOtp, true);
});

test("supports product-only and large-quantity carts", () => {
  const summary = calculateCheckoutSummary({
    customerId: "00000000-0000-0000-0000-000000000001",
    reward: rewardSummary({
      subtotalPaise: 99_000,
      finalPaidPaise: 99_000,
      rewardEarnedPaise: 9_900,
      newWalletBalancePaise: 14_900,
    }),
    items: [
      {
        catalogItemId: "00000000-0000-0000-0000-000000000011",
        name: "Shampoo",
        type: "product",
        unitPricePaise: 1_000,
        quantity: 99,
        totalPaise: 0,
      },
    ],
  });

  assert.equal(summary.serviceSubtotalPaise, 0);
  assert.equal(summary.productSubtotalPaise, 99_000);
  assert.equal(summary.items[0]?.totalPaise, 99_000);
});

test("rejects empty carts and mismatched reward calculations", () => {
  assert.throws(() =>
    calculateCheckoutSummary({
      customerId: "00000000-0000-0000-0000-000000000001",
      reward: rewardSummary({ subtotalPaise: 0 }),
      items: [],
    }),
  );
  assert.throws(() =>
    calculateCheckoutSummary({
      customerId: "00000000-0000-0000-0000-000000000001",
      reward: rewardSummary({ subtotalPaise: 999 }),
      items: [
        {
          catalogItemId: "00000000-0000-0000-0000-000000000010",
          name: "Haircut",
          type: "service",
          unitPricePaise: 1_000,
          quantity: 1,
          totalPaise: 0,
        },
      ],
    }),
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateBill,
  calculateNewWalletBalance,
  calculateRewardEarned,
} from "./billing-math";

test("earns rewards from final paid, not from subtotal", () => {
  const result = calculateBill({
    items: [{ unitPricePaise: 100_000, quantity: 1 }],
    walletBalancePaise: 50_000,
    maxRedeemPercentage: 20,
    rewardPercentage: 10,
    rewardAppliedPaise: 20_000,
  });

  assert.equal(result.subtotalPaise, 100_000);
  assert.equal(result.maxRedeemPaise, 20_000);
  assert.equal(result.finalPaidPaise, 80_000);
  assert.equal(result.rewardEarnedPaise, 8_000);
  assert.equal(result.newWalletBalancePaise, 38_000);
});

test("caps redemption by the wallet when it is lower than the business cap", () => {
  const result = calculateBill({
    items: [{ unitPricePaise: 100_000, quantity: 1 }],
    walletBalancePaise: 5_000,
    maxRedeemPercentage: 20,
    rewardPercentage: 10,
    rewardAppliedPaise: 20_000,
  });

  assert.equal(result.maxRedeemPaise, 5_000);
  assert.equal(result.rewardAppliedPaise, 5_000);
  assert.equal(result.finalPaidPaise, 95_000);
});

test("handles a zero wallet and zero-value bill without a negative balance", () => {
  const result = calculateBill({
    items: [{ unitPricePaise: 0, quantity: 1 }],
    walletBalancePaise: 0,
    maxRedeemPercentage: 20,
    rewardPercentage: 10,
    rewardAppliedPaise: 0,
  });

  assert.deepEqual(result, {
    subtotalPaise: 0,
    maxRedeemPaise: 0,
    rewardAppliedPaise: 0,
    finalPaidPaise: 0,
    rewardEarnedPaise: 0,
    newWalletBalancePaise: 0,
  });
});

test("rounds reward earning half-up to the nearest paise", () => {
  assert.equal(calculateRewardEarned(105, 10), 11);
});

test("rejects negative values and over-redemption", () => {
  assert.throws(() =>
    calculateBill({
      items: [{ unitPricePaise: -1, quantity: 1 }],
      walletBalancePaise: 0,
      maxRedeemPercentage: 20,
      rewardPercentage: 10,
      rewardAppliedPaise: 0,
    }),
  );
  assert.throws(() => calculateNewWalletBalance(100, 101, 0));
});

test("keeps large safe integer bills precise", () => {
  const result = calculateBill({
    items: [{ unitPricePaise: 9_000_000_000_000, quantity: 1 }],
    walletBalancePaise: 9_000_000_000_000,
    maxRedeemPercentage: 50,
    rewardPercentage: 50,
    rewardAppliedPaise: 9_000_000_000_000,
  });

  assert.equal(result.maxRedeemPaise, 4_500_000_000_000);
  assert.equal(result.finalPaidPaise, 4_500_000_000_000);
  assert.equal(result.rewardEarnedPaise, 2_250_000_000_000);
});

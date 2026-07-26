import { test, assert } from "vitest";
import { isAppError } from "../../../lib/errors/app-error";
import type { RewardSummary } from "../types";
import { assertValidRewardRedemption } from "./reward-validation";

const summary: RewardSummary = {
  customerId: "00000000-0000-0000-0000-000000000001",
  walletBalancePaise: 2_000,
  newWalletBalancePaise: 0,
  rewardPercentage: 10,
  maxRedeemPercentage: 20,
  subtotalPaise: 10_000,
  maxRedeemPaise: 1_500,
  rewardRequestedPaise: 0,
  rewardAppliedPaise: 0,
  finalPaidPaise: 10_000,
  rewardEarnedPaise: 1_000,
  requiresOtp: false,
};

function assertRewardError(
  fn: () => void,
  expectedCode:
    "VALIDATION_FAILED" | "WALLET_INSUFFICIENT" | "REWARD_LIMIT_EXCEEDED",
) {
  try {
    fn();
    assert.fail("Expected function to throw an error");
  } catch (error) {
    if (!isAppError(error)) {
      assert.fail("Error is not an AppError");
    }
    assert.equal(error.code, expectedCode);
  }
}

test("allows zero or a valid whole-rupee redemption", () => {
  assert.doesNotThrow(() => assertValidRewardRedemption(0, summary));
  assert.doesNotThrow(() => assertValidRewardRedemption(1_500, summary));
});

test("enforces the ₹1 minimum and rejects negative values", () => {
  assertRewardError(
    () => assertValidRewardRedemption(99, summary),
    "VALIDATION_FAILED",
  );
  assertRewardError(
    () => assertValidRewardRedemption(-1, summary),
    "VALIDATION_FAILED",
  );
});

test("rejects redemptions above the wallet and business cap", () => {
  assertRewardError(
    () => assertValidRewardRedemption(2_001, summary),
    "WALLET_INSUFFICIENT",
  );
  assertRewardError(
    () => assertValidRewardRedemption(1_501, summary),
    "REWARD_LIMIT_EXCEEDED",
  );
});

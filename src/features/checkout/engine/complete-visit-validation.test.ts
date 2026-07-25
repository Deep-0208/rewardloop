import assert from "node:assert/strict";
import test from "node:test";
import { validateVisitCompletion } from "./complete-visit-validation";

test("allows cash and online payments for a positive final payable", () => {
  assert.doesNotThrow(() =>
    validateVisitCompletion({
      finalPayablePaise: 8_000,
      rewardAppliedPaise: 0,
      paymentMethod: "cash",
      otpVerifiedToken: null,
    }),
  );
  assert.doesNotThrow(() =>
    validateVisitCompletion({
      finalPayablePaise: 8_000,
      rewardAppliedPaise: 100,
      paymentMethod: "online",
      otpVerifiedToken: "a-token",
    }),
  );
});

test("requires a verified OTP when rewards are redeemed", () => {
  assert.throws(
    () =>
      validateVisitCompletion({
        finalPayablePaise: 8_000,
        rewardAppliedPaise: 100,
        paymentMethod: "cash",
        otpVerifiedToken: null,
      }),
    /Verify the reward OTP/,
  );
});

test("requires no payment method only for zero-value visits", () => {
  assert.doesNotThrow(() =>
    validateVisitCompletion({
      finalPayablePaise: 0,
      rewardAppliedPaise: 1_000,
      paymentMethod: "none",
      otpVerifiedToken: "a-token",
    }),
  );
  assert.throws(
    () =>
      validateVisitCompletion({
        finalPayablePaise: 0,
        rewardAppliedPaise: 0,
        paymentMethod: "cash",
        otpVerifiedToken: null,
      }),
    /zero-value/,
  );
  assert.throws(
    () =>
      validateVisitCompletion({
        finalPayablePaise: 1,
        rewardAppliedPaise: 0,
        paymentMethod: "none",
        otpVerifiedToken: null,
      }),
    /Choose cash or online/,
  );
});

test("rejects negative and non-integer financial values", () => {
  assert.throws(() =>
    validateVisitCompletion({
      finalPayablePaise: -1,
      rewardAppliedPaise: 0,
      paymentMethod: "cash",
      otpVerifiedToken: null,
    }),
  );
  assert.throws(() =>
    validateVisitCompletion({
      finalPayablePaise: 100.5,
      rewardAppliedPaise: 0,
      paymentMethod: "cash",
      otpVerifiedToken: null,
    }),
  );
});

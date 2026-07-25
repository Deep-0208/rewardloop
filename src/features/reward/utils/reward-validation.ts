import { AppError } from "../../../lib/errors/app-error";
import type { Paise } from "../../../types/domain";
import type { RewardSummary } from "../types";

/**
 * Enforces redemption rules against a freshly calculated server summary.
 * This intentionally rejects stale/manipulated values; display calculations
 * use calculateReward, which safely clamps instead.
 */
export function assertValidRewardRedemption(
  requestedPaise: Paise,
  summary: RewardSummary,
): void {
  if (!Number.isSafeInteger(requestedPaise) || requestedPaise < 0) {
    throw new AppError(
      "Reward amount must be a non-negative paise value.",
      "VALIDATION_FAILED",
    );
  }
  if (requestedPaise > 0 && requestedPaise < 100) {
    throw new AppError("Minimum redemption is ₹1.", "VALIDATION_FAILED");
  }
  if (requestedPaise > summary.walletBalancePaise) {
    throw new AppError(
      "Reward amount exceeds the available wallet balance.",
      "WALLET_INSUFFICIENT",
    );
  }
  if (requestedPaise > summary.maxRedeemPaise) {
    throw new AppError(
      "Reward amount exceeds the maximum redeem limit.",
      "REWARD_LIMIT_EXCEEDED",
    );
  }
}

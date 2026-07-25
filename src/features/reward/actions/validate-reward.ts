"use server";

import { actionSuccess } from "@/lib/api";
import { AppError, handleActionError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { rewardCalculationSchema } from "../schemas";
import { calculateRewardSummary } from "../services/reward-calculation-service";
import { assertValidRewardRedemption } from "../utils/reward-validation";
import type {
  RewardCalculationInput,
  RewardValidationResponse,
} from "../types";

/**
 * Strictly validates a requested redemption against fresh server data.
 * Unlike calculateReward, this action rejects rather than silently clamping a
 * stale or manipulated submission.
 */
export async function validateReward(
  input: RewardCalculationInput,
): Promise<RewardValidationResponse> {
  try {
    const parsed = rewardCalculationSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid reward calculation input.",
        "VALIDATION_FAILED",
      );
    }

    const summary = await calculateRewardSummary(
      await createClient(),
      parsed.data,
    );
    assertValidRewardRedemption(parsed.data.rewardRequestedPaise, summary);

    return actionSuccess({ valid: true, summary });
  } catch (error) {
    return handleActionError(error);
  }
}

"use server";

import { actionSuccess } from "@/lib/api";
import { AppError, handleActionError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { rewardCalculationSchema } from "../schemas";
import { calculateRewardSummary } from "../services/reward-calculation-service";
import type { RewardCalculationInput, RewardSummaryResponse } from "../types";

/**
 * Returns an authoritative, clamped reward calculation for the active bill.
 * This action is safe to call for display: it does not mutate a wallet.
 */
export async function calculateReward(
  input: RewardCalculationInput,
): Promise<RewardSummaryResponse> {
  try {
    const parsed = rewardCalculationSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid reward calculation input.",
        "VALIDATION_FAILED",
      );
    }

    const supabase = await createClient();
    const summary = await calculateRewardSummary(supabase, parsed.data);
    return actionSuccess(summary);
  } catch (error) {
    return handleActionError(error);
  }
}

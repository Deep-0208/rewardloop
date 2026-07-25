"use server";

import { calculateReward } from "./calculate-reward";
import type { RewardCalculationInput, RewardSummaryResponse } from "../types";

/**
 * Loads the initial reward summary for the reward screen.
 * Kept as a named action so the UI can make intent explicit without writing
 * any financial data.
 */
export async function previewReward(
  input: RewardCalculationInput,
): Promise<RewardSummaryResponse> {
  return calculateReward(input);
}

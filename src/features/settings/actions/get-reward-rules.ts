"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";
import type { GetRewardRulesResponse } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("get-reward-rules");

/** Fetch current reward rules. */
export async function getRewardRules(): Promise<GetRewardRulesResponse> {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();

    const validation = await validateRewardLoopSession(
      supabase,
      cookieStore.get(SESSION_VERSION_COOKIE.name)?.value,
    );
    if (!validation.valid) {
      throw new AppError("Authentication required.", "AUTH_REQUIRED");
    }

    const { data, error } = await supabase
      .from("reward_rules")
      .select("id, reward_percentage, max_redeem_percentage")
      .maybeSingle();

    if (error) {
      log.error("Failed to fetch reward rules", {
        code: error.code,
        message: error.message,
      });
      throw new AppError("Reward rules not found.", "BUSINESS_NOT_FOUND");
    }

    if (!data) {
      return actionSuccess({
        id: "",
        rewardPercentage: 0,
        maxRedeemPercentage: 0,
      });
    }

    return actionSuccess({
      id: data.id,
      rewardPercentage: data.reward_percentage,
      maxRedeemPercentage: data.max_redeem_percentage,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

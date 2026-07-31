"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { rewardRulesSchema } from "../schemas";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";
import type { RewardRulesInput, UpdateRewardRulesResponse } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("update-reward-rules");

/** Update reward rules. */
export async function updateRewardRules(
  input: RewardRulesInput,
): Promise<UpdateRewardRulesResponse> {
  try {
    const parseResult = rewardRulesSchema.safeParse(input);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new AppError(
        issue?.message ?? "Invalid reward rules.",
        "VALIDATION_FAILED",
      );
    }

    const { rewardPercentage, maxRedeemPercentage } = parseResult.data;
    const cookieStore = await cookies();
    const supabase = await createClient();

    const validation = await validateRewardLoopSession(
      supabase,
      cookieStore.get(SESSION_VERSION_COOKIE.name)?.value,
    );
    if (!validation.valid) {
      throw new AppError("Authentication required.", "AUTH_REQUIRED");
    }

    const { data: userData } = await supabase
      .from("users")
      .select("id, business_id")
      .single();

    if (!userData?.business_id) {
      throw new AppError("Business not found.", "BUSINESS_NOT_FOUND");
    }

    const { data, error } = await supabase
      .from("reward_rules")
      .upsert(
        {
          business_id: userData.business_id,
          reward_percentage: rewardPercentage,
          max_redeem_percentage: maxRedeemPercentage,
          created_by: userData.id,
        },
        { onConflict: "business_id" },
      )
      .select("id, reward_percentage, max_redeem_percentage")
      .single();

    if (error) {
      log.error("Failed to update reward rules", {
        code: error.code,
        message: error.message,
      });
      throw new AppError("Failed to update reward rules.", "SERVER_ERROR");
    }

    revalidatePath("/more/rewards");
    revalidatePath("/more");

    return actionSuccess({
      id: data.id,
      rewardPercentage: data.reward_percentage,
      maxRedeemPercentage: data.max_redeem_percentage,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

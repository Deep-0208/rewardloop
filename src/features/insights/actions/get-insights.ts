/**
 * RewardLoop — Get Insights Server Action.
 *
 * Fetches analytics data for the authenticated business.
 *
 * @module features/insights/actions/get-insights
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { getInsightsData } from "../services/insights-service";
import type { GetInsightsResponse } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";
import { cookies } from "next/headers";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";

/**
 * Server Action: Fetch insights data.
 *
 * - Accepts no parameters (IDOR prevention).
 * - Auth handled by createClient + RLS.
 * - Returns ActionResult<InsightsData>.
 */
export async function getInsights(): Promise<GetInsightsResponse> {
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

    const data = await getInsightsData(supabase, validation.businessId ?? undefined);
    return actionSuccess(data);
  } catch (error) {
    return handleActionError(error);
  }
}

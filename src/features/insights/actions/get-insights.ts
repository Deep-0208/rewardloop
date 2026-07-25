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
import { handleActionError } from "@/lib/errors";

/**
 * Server Action: Fetch insights data.
 *
 * - Accepts no parameters (IDOR prevention).
 * - Auth handled by createClient + RLS.
 * - Returns ActionResult<InsightsData>.
 */
export async function getInsights(): Promise<GetInsightsResponse> {
  try {
    const supabase = await createClient();
    const data = await getInsightsData(supabase);
    return actionSuccess(data);
  } catch (error) {
    return handleActionError(error);
  }
}

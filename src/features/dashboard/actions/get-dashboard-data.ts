/**
 * RewardLoop — Get Dashboard Data Server Action.
 *
 * Fetches KPIs, recent transactions, and aggregates for the merchant dashboard.
 * Zero client parameters — businessId is derived from RLS.
 *
 * @module features/dashboard/actions/get-dashboard-data
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { getDashboard } from "../services/dashboard-service";
import type { GetDashboardDataResponse } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError } from "@/lib/errors";

/**
 * Server Action: Fetch dashboard data.
 *
 * - Accepts no parameters (IDOR prevention).
 * - Auth handled by createClient + RLS.
 * - Returns ActionResult<DashboardData>.
 */
export async function getDashboardData(): Promise<GetDashboardDataResponse> {
  try {
    const supabase = await createClient();
    const data = await getDashboard(supabase);
    return actionSuccess(data);
  } catch (error) {
    return handleActionError(error);
  }
}

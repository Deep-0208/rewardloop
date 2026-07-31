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
import { handleActionError, AppError } from "@/lib/errors";
import { cookies } from "next/headers";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";

/**
 * Server Action: Fetch dashboard data.
 *
 * - Accepts no parameters (IDOR prevention).
 * - Auth handled by createClient + RLS.
 * - Returns ActionResult<DashboardData>.
 */
export async function getDashboardData(): Promise<GetDashboardDataResponse> {
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

    const data = await getDashboard(supabase);
    return actionSuccess(data);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * RewardLoop — Get Transactions Server Action.
 *
 * Fetches the transaction history for the authenticated business.
 *
 * @module features/transactions/actions/get-transactions
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { getTransactionHistory } from "../services/transaction-service";
import type { GetTransactionsResponse } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";
import { cookies } from "next/headers";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";

import { actionRateLimit } from "@/lib/rate-limit";

/**
 * Server Action: Fetch transaction history.
 *
 * - Accepts optional `limit` parameter (max 100, default 50).
 * - Rate limited to 60 requests / min.
 * - Auth handled by createClient + RLS.
 * - Returns ActionResult<TransactionRow[]>.
 */
export async function getTransactions(
  limit = 50,
): Promise<GetTransactionsResponse> {
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

    if (validation.businessId) {
      const rateLimitResult = await actionRateLimit.limit(
        `get_transactions_${validation.businessId}`,
      );
      if (!rateLimitResult.success) {
        throw new AppError(
          "Too many transaction requests. Please wait a moment.",
          "RATE_LIMITED",
        );
      }
    }

    const safeLimit = Math.min(Math.max(1, limit), 100);
    const transactions = await getTransactionHistory(supabase, safeLimit);
    return actionSuccess(transactions);
  } catch (error) {
    return handleActionError(error);
  }
}

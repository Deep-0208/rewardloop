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

/**
 * Server Action: Fetch transaction history.
 *
 * - Accepts no parameters (IDOR prevention).
 * - Auth handled by createClient + RLS.
 * - Returns ActionResult<TransactionRow[]>.
 */
export async function getTransactions(): Promise<GetTransactionsResponse> {
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

    const transactions = await getTransactionHistory(supabase);
    return actionSuccess(transactions);
  } catch (error) {
    return handleActionError(error);
  }
}

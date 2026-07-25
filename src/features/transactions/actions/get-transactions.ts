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
import { handleActionError } from "@/lib/errors";

/**
 * Server Action: Fetch transaction history.
 *
 * - Accepts no parameters (IDOR prevention).
 * - Auth handled by createClient + RLS.
 * - Returns ActionResult<TransactionRow[]>.
 */
export async function getTransactions(): Promise<GetTransactionsResponse> {
  try {
    const supabase = await createClient();
    const transactions = await getTransactionHistory(supabase);
    return actionSuccess(transactions);
  } catch (error) {
    return handleActionError(error);
  }
}

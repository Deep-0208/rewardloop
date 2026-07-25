/**
 * RewardLoop — Transactions Feature Types.
 *
 * Domain types for the transaction history page.
 * All monetary values are in paise (integer).
 *
 * @module features/transactions/types
 */

import type { ActionResult, Paise, UUID, Timestamp } from "@/types";

/** Transaction row for the history list. */
export interface TransactionRow {
  readonly id: UUID;
  readonly customerName: string | null;
  readonly customerPhone: string;
  readonly subtotalPaise: Paise;
  readonly rewardUsedPaise: Paise;
  readonly rewardEarnedPaise: Paise;
  readonly finalPaidPaise: Paise;
  readonly paymentMethod: "cash" | "online" | "none";
  readonly createdAt: Timestamp;
  readonly itemCount: number;
}

/** Server Action response for getTransactions */
export type GetTransactionsResponse = ActionResult<TransactionRow[]>;

/**
 * RewardLoop — Insights Feature Types.
 *
 * Domain types for the analytics/insights page.
 * All monetary values are in paise (integer).
 *
 * @module features/insights/types
 */

import type { ActionResult, Paise, UUID } from "@/types";

/** Business-wide aggregated stats. */
export interface InsightsOverview {
  readonly totalRevenuePaise: Paise;
  readonly totalTransactions: number;
  readonly totalCustomers: number;
  readonly totalRewardsEarnedPaise: Paise;
  readonly totalRewardsRedeemedPaise: Paise;
  readonly averageTransactionPaise: Paise;
}

/** Top-selling service/product item. */
export interface TopServiceItem {
  readonly catalogItemId: UUID | null;
  readonly name: string;
  readonly totalQuantity: number;
  readonly totalRevenuePaise: Paise;
}

/** Most active customer. */
export interface TopCustomer {
  readonly id: UUID;
  readonly name: string | null;
  readonly phone: string;
  readonly totalVisits: number;
  readonly totalSpentPaise: Paise;
}

/** Full insights data payload. */
export interface InsightsData {
  readonly overview: InsightsOverview;
  readonly topServices: TopServiceItem[];
  readonly topCustomers: TopCustomer[];
}

/** Server Action response for getInsights */
export type GetInsightsResponse = ActionResult<InsightsData>;

/**
 * RewardLoop — Dashboard Feature Types.
 *
 * Domain types for the merchant Dashboard home page.
 * All monetary values are in paise (integer).
 *
 * @module features/dashboard/types
 */

import type { ActionResult, Paise, UUID, Timestamp } from "@/types";

/** Key performance indicators displayed on the dashboard. */
export interface DashboardKpis {
  /** Total revenue today in paise */
  readonly todayRevenuePaise: Paise;
  /** Number of transactions completed today */
  readonly todayTransactions: number;
  /** Total unique customers served today */
  readonly todayCustomers: number;
  /** Total rewards redeemed today in paise */
  readonly todayRewardsRedeemedPaise: Paise;
}

/** Compact transaction row for the "Recent Transactions" list. */
export interface RecentTransaction {
  readonly id: UUID;
  readonly customerName: string | null;
  readonly customerPhone: string;
  readonly subtotalPaise: Paise;
  readonly rewardUsedPaise: Paise;
  readonly rewardEarnedPaise: Paise;
  readonly finalPaidPaise: Paise;
  readonly paymentMethod: "cash" | "online" | "none";
  readonly createdAt: Timestamp;
}

/** Full dashboard data payload returned by the server action. */
export interface DashboardData {
  readonly kpis: DashboardKpis;
  readonly recentTransactions: RecentTransaction[];
  /** Total registered customers for the business */
  readonly totalCustomers: number;
  /** Total lifetime revenue in paise */
  readonly lifetimeRevenuePaise: Paise;
}

/** Server Action response for getDashboardData */
export type GetDashboardDataResponse = ActionResult<DashboardData>;

/**
 * RewardLoop — Insights Service.
 *
 * Server-only analytics aggregation for the insights page.
 * Queries transactions, transaction_items, and customers for business-wide metrics.
 *
 * @module features/insights/services/insights-service
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createLogger } from "@/lib/logger";
import type {
  InsightsData,
  InsightsOverview,
  TopServiceItem,
  TopCustomer,
} from "../types";

const log = createLogger("insights");

/**
 * Fetch aggregated business overview stats.
 */
async function fetchOverview(
  supabase: SupabaseClient,
): Promise<InsightsOverview> {
  const [txResult, customerResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("final_paid, reward_used, reward_earned"),
    supabase.from("customers").select("id", { count: "exact", head: true }),
  ]);

  if (txResult.error) {
    log.error("Failed to fetch transaction aggregates", {
      code: txResult.error.code,
      message: txResult.error.message,
    });
    throw txResult.error;
  }
  if (customerResult.error) {
    log.error("Failed to count customers", {
      code: customerResult.error.code,
      message: customerResult.error.message,
    });
    throw customerResult.error;
  }

  const rows = txResult.data ?? [];
  const totalTransactions = rows.length;
  const totalRevenuePaise = rows.reduce(
    (s: number, r: { final_paid: number }) => s + r.final_paid,
    0,
  );
  const totalRewardsRedeemedPaise = rows.reduce(
    (s: number, r: { reward_used: number }) => s + r.reward_used,
    0,
  );
  const totalRewardsEarnedPaise = rows.reduce(
    (s: number, r: { reward_earned: number }) => s + r.reward_earned,
    0,
  );

  return {
    totalRevenuePaise,
    totalTransactions,
    totalCustomers: customerResult.count ?? 0,
    totalRewardsEarnedPaise,
    totalRewardsRedeemedPaise,
    averageTransactionPaise:
      totalTransactions > 0
        ? Math.round(totalRevenuePaise / totalTransactions)
        : 0,
  };
}

/**
 * Fetch the top 5 most sold services/products by quantity.
 */
async function fetchTopServices(
  supabase: SupabaseClient,
): Promise<TopServiceItem[]> {
  const { data, error } = await supabase
    .from("transaction_items")
    .select("catalog_item_id, item_name, quantity, total_price");

  if (error) {
    log.error("Failed to fetch transaction items for top services", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  // Aggregate by item_name (since catalog_item_id can be null for deleted items)
  const map = new Map<
    string,
    {
      catalogItemId: string | null;
      totalQuantity: number;
      totalRevenuePaise: number;
    }
  >();
  for (const row of data ?? []) {
    const name = row.item_name as string;
    const existing = map.get(name);
    if (existing) {
      existing.totalQuantity += row.quantity as number;
      existing.totalRevenuePaise += row.total_price as number;
    } else {
      map.set(name, {
        catalogItemId: row.catalog_item_id as string | null,
        totalQuantity: row.quantity as number,
        totalRevenuePaise: row.total_price as number,
      });
    }
  }

  return Array.from(map.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5);
}

/**
 * Fetch the top 5 most active customers by visit count.
 */
async function fetchTopCustomers(
  supabase: SupabaseClient,
): Promise<TopCustomer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, total_visits")
    .order("total_visits", { ascending: false })
    .limit(5);

  if (error) {
    log.error("Failed to fetch top customers", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  // For each customer, get their total spent
  const customers: TopCustomer[] = [];
  for (const customer of data ?? []) {
    const { data: txData } = await supabase
      .from("transactions")
      .select("final_paid")
      .eq("customer_id", customer.id);

    const totalSpentPaise = (txData ?? []).reduce(
      (s: number, r: { final_paid: number }) => s + r.final_paid,
      0,
    );

    customers.push({
      id: customer.id as string,
      name: customer.name as string | null,
      phone: customer.phone as string,
      totalVisits: customer.total_visits as number,
      totalSpentPaise,
    });
  }

  return customers;
}

/**
 * Fetch all insights data in a single coordinated call.
 */
export async function getInsightsData(
  supabase: SupabaseClient,
): Promise<InsightsData> {
  const [overview, topServices, topCustomers] = await Promise.all([
    fetchOverview(supabase),
    fetchTopServices(supabase),
    fetchTopCustomers(supabase),
  ]);

  return { overview, topServices, topCustomers };
}

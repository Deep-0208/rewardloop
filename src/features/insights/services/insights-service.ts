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
  const { data, error } = await supabase.rpc("get_insights_overview");

  if (error) {
    log.error("Failed to fetch transaction aggregates", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  return data as InsightsOverview;
}

/**
 * Fetch the top 5 most sold services/products by quantity.
 */
async function fetchTopServices(
  supabase: SupabaseClient,
): Promise<TopServiceItem[]> {
  const { data, error } = await supabase.rpc("get_insights_top_services");

  if (error) {
    log.error("Failed to fetch transaction items for top services", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  return (data as TopServiceItem[]) ?? [];
}

/**
 * Fetch the top 5 most active customers by visit count.
 */
async function fetchTopCustomers(
  supabase: SupabaseClient,
): Promise<TopCustomer[]> {
  const { data, error } = await supabase.rpc("get_insights_top_customers");

  if (error) {
    log.error("Failed to fetch top customers", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  return (data as TopCustomer[]) ?? [];
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

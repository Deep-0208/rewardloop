/**
 * RewardLoop — Dashboard Service.
 *
 * Server-only data access for the merchant dashboard.
 * Queries transactions, customers, and reward ledger for KPIs.
 *
 * Architecture: Server Action → Service → Supabase (no repository layer).
 *
 * @module features/dashboard/services/dashboard-service
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createLogger } from "@/lib/logger";
import type { DashboardData, DashboardKpis, RecentTransaction } from "../types";

const log = createLogger("dashboard");

/**
 * Get the start of today in IST (UTC+5:30), returned as a UTC ISO string.
 */
function todayStartUtc(): string {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffsetMs);
  istTime.setUTCHours(0, 0, 0, 0);
  return new Date(istTime.getTime() - istOffsetMs).toISOString();
}

/**
 * Fetch dashboard KPIs for today.
 *
 * RLS enforces business_id = auth_business_id() on all tables.
 */
async function fetchTodayKpis(
  supabase: SupabaseClient,
): Promise<DashboardKpis> {
  const todayStart = todayStartUtc();
  const startTime = Date.now();

  const { data, error } = await supabase.rpc("get_today_kpis", {
    p_start_time: todayStart,
  });

  log.info("KPI query executed", { elapsedMs: Date.now() - startTime });

  if (error) {
    log.error("Failed to fetch today's KPIs", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  return {
    todayRevenuePaise: data?.todayRevenuePaise ?? 0,
    todayTransactions: data?.todayTransactions ?? 0,
    todayCustomers: data?.todayCustomers ?? 0,
    todayRewardsRedeemedPaise: data?.todayRewardsRedeemedPaise ?? 0,
  };
}

/**
 * Fetch the 5 most recent transactions with customer info.
 */
async function fetchRecentTransactions(
  supabase: SupabaseClient,
): Promise<RecentTransaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      id,
      subtotal,
      reward_used,
      reward_earned,
      final_paid,
      payment_method,
      created_at,
      customers!inner ( name, phone ),
      transaction_items ( quantity, unit_price, catalog_items ( type ) )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    log.error("Failed to fetch recent transactions", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const customer = row.customers as {
      name: string | null;
      phone: string;
    } | null;

    const items =
      (row.transaction_items as Array<{
        quantity: number;
        unit_price: number;
        catalog_items: { type: "service" | "product" } | null;
      }>) || [];
    let serviceSubtotalPaise = 0;
    let productSubtotalPaise = 0;
    for (const item of items) {
      if (item.catalog_items?.type === "product") {
        productSubtotalPaise += item.quantity * item.unit_price;
      } else {
        serviceSubtotalPaise += item.quantity * item.unit_price;
      }
    }

    return {
      id: row.id as string,
      customerName: customer?.name ?? null,
      customerPhone: customer?.phone ?? "",
      subtotalPaise: row.subtotal as number,
      serviceSubtotalPaise,
      productSubtotalPaise,
      rewardUsedPaise: row.reward_used as number,
      rewardEarnedPaise: row.reward_earned as number,
      finalPaidPaise: row.final_paid as number,
      paymentMethod: row.payment_method as "cash" | "online" | "none",
      createdAt: row.created_at as string,
    };
  });
}

/**
 * Fetch aggregate business stats.
 */
async function fetchAggregates(
  supabase: SupabaseClient,
): Promise<{
  totalCustomers: number;
  lifetimeRevenuePaise: number;
  businessName: string;
}> {
  const [customerResult, revenueResult, businessResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .gt("total_visits", 0),
    supabase.rpc("get_lifetime_revenue"),
    supabase.from("businesses").select("name").limit(1).maybeSingle(),
  ]);

  if (customerResult.error) {
    log.error("Failed to count customers", {
      code: customerResult.error.code,
      message: customerResult.error.message,
    });
    throw customerResult.error;
  }

  if (revenueResult.error) {
    log.error("Failed to sum revenue", {
      code: revenueResult.error.code,
      message: revenueResult.error.message,
    });
    throw revenueResult.error;
  }

  if (businessResult.error) {
    log.error("Failed to get business name", {
      code: businessResult.error.code,
      message: businessResult.error.message,
    });
  }

  const lifetimeRevenuePaise = (revenueResult.data as number) ?? 0;

  return {
    totalCustomers: customerResult.count ?? 0,
    lifetimeRevenuePaise,
    businessName: businessResult.data?.name ?? "My Business",
  };
}

import { serverCache } from "@/lib/server-cache";

/**
 * Fetch all dashboard data in a single coordinated call.
 *
 * @param supabase - Authenticated Supabase server client
 * @param businessId - Optional business tenant ID for Redis server caching
 * @returns Complete DashboardData payload
 * @throws On database errors
 */
export async function getDashboard(
  supabase: SupabaseClient,
  businessId?: string,
): Promise<DashboardData> {
  const fetchFn = async (): Promise<DashboardData> => {
    const [kpis, recentTransactions, aggregates] = await Promise.all([
      fetchTodayKpis(supabase),
      fetchRecentTransactions(supabase),
      fetchAggregates(supabase),
    ]);

    return {
      kpis,
      recentTransactions,
      totalCustomers: aggregates.totalCustomers,
      lifetimeRevenuePaise: aggregates.lifetimeRevenuePaise,
      businessName: aggregates.businessName,
    };
  };

  if (businessId) {
    return serverCache.fetch<DashboardData>(
      "dashboard_data",
      fetchFn,
      { ttlSeconds: 60, businessId },
    );
  }

  return fetchFn();
}


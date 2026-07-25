/**
 * RewardLoop — Settings Service.
 *
 * Server-only data access for the settings page.
 * Queries businesses, reward_rules, catalog_items, and customers.
 *
 * @module features/settings/services/settings-service
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createLogger } from "@/lib/logger";
import type {
  SettingsData,
  BusinessProfile,
  RewardRulesConfig,
  CatalogManagementItem,
} from "../types";

const log = createLogger("settings");

/**
 * Fetch business profile for the current user.
 */
async function fetchProfile(
  supabase: SupabaseClient,
): Promise<BusinessProfile> {
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, business_type, email, gst_number, address")
    .maybeSingle();

  if (error) {
    log.error("Failed to fetch business profile", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  if (!data) {
    return {
      id: "",
      name: "My Business",
      businessType: "salon",
      email: null,
      gstNumber: null,
      address: null,
    };
  }

  return {
    id: data.id,
    name: data.name,
    businessType: data.business_type,
    email: data.email,
    gstNumber: data.gst_number,
    address: data.address,
  };
}

/**
 * Fetch reward rules for the current business.
 */
async function fetchRewardRules(
  supabase: SupabaseClient,
): Promise<RewardRulesConfig | null> {
  const { data, error } = await supabase
    .from("reward_rules")
    .select("id, reward_percentage, max_redeem_percentage")
    .maybeSingle();

  if (error) {
    log.error("Failed to fetch reward rules", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    rewardPercentage: data.reward_percentage,
    maxRedeemPercentage: data.max_redeem_percentage,
  };
}

/**
 * Fetch all settings page data.
 */
export async function getSettingsData(
  supabase: SupabaseClient,
): Promise<SettingsData> {
  const [profile, rewardRules, catalogResult, customerResult] =
    await Promise.all([
      fetchProfile(supabase),
      fetchRewardRules(supabase),
      supabase
        .from("catalog_items")
        .select("id", { count: "exact", head: true }),
      supabase.from("customers").select("id", { count: "exact", head: true }),
    ]);

  if (catalogResult.error) {
    log.error("Failed to count catalog items", {
      code: catalogResult.error.code,
      message: catalogResult.error.message,
    });
    throw catalogResult.error;
  }
  if (customerResult.error) {
    log.error("Failed to count customers", {
      code: customerResult.error.code,
      message: customerResult.error.message,
    });
    throw customerResult.error;
  }

  return {
    profile,
    rewardRules,
    catalogItemCount: catalogResult.count ?? 0,
    customerCount: customerResult.count ?? 0,
  };
}

/**
 * Fetch all catalog items (including inactive) for management.
 */
export async function getCatalogManagement(
  supabase: SupabaseClient,
): Promise<CatalogManagementItem[]> {
  const { data, error } = await supabase
    .from("catalog_items")
    .select("id, name, price, type, status, created_at")
    .order("status", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    log.error("Failed to fetch catalog items for management", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    price: row.price as number,
    type: row.type as "service" | "product",
    status: row.status as "active" | "inactive",
    createdAt: row.created_at as string,
  }));
}

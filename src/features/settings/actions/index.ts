/**
 * RewardLoop — Settings Server Actions.
 *
 * Server actions for fetching settings data and managing catalog items.
 *
 * @module features/settings/actions
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getSettingsData,
  getCatalogManagement,
} from "../services/settings-service";
import {
  catalogItemSchema,
  rewardRulesSchema,
  businessProfileSchema,
} from "../schemas";
import { cookies } from "next/headers";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";
import { z } from "zod";
import type {
  GetSettingsResponse,
  GetCatalogManagementResponse,
  MutateCatalogItemResponse,
  CatalogItemInput,
  RewardRulesInput,
  UpdateRewardRulesResponse,
  GetRewardRulesResponse,
  BusinessProfileInput,
  UpdateBusinessProfileResponse,
} from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("settings-actions");

/** Fetch settings page data. */
export async function getSettings(): Promise<GetSettingsResponse> {
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

    const data = await getSettingsData(supabase);
    return actionSuccess(data);
  } catch (error) {
    return handleActionError(error);
  }
}

/** Fetch catalog items for management (including inactive). */
export async function getCatalogItems(): Promise<GetCatalogManagementResponse> {
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

    const items = await getCatalogManagement(supabase);
    return actionSuccess(items);
  } catch (error) {
    return handleActionError(error);
  }
}

/** Create a new catalog item. */
export async function createCatalogItem(
  input: CatalogItemInput,
): Promise<MutateCatalogItemResponse> {
  try {
    const parseResult = catalogItemSchema.safeParse(input);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new AppError(
        issue?.message ?? "Invalid catalog item.",
        "VALIDATION_FAILED",
      );
    }

    const { name, price, type } = parseResult.data;
    const cookieStore = await cookies();
    const supabase = await createClient();

    const validation = await validateRewardLoopSession(
      supabase,
      cookieStore.get(SESSION_VERSION_COOKIE.name)?.value,
    );
    if (!validation.valid) {
      throw new AppError("Authentication required.", "AUTH_REQUIRED");
    }

    // Get user's catalog_id and business_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, business_id")
      .single();

    if (userError || !userData?.business_id) {
      throw new AppError("Business not found.", "BUSINESS_NOT_FOUND");
    }

    let { data: catalogData } = await supabase
      .from("catalogs")
      .select("id")
      .eq("business_id", userData.business_id)
      .maybeSingle();

    if (!catalogData) {
      const { data: newCatalog, error: insertError } = await supabase
        .from("catalogs")
        .insert({ business_id: userData.business_id, name: "Default Catalog" })
        .select("id")
        .single();

      if (insertError || !newCatalog) {
        throw new AppError(
          "Catalog not found and unable to create one.",
          "BUSINESS_NOT_FOUND",
        );
      }
      catalogData = newCatalog;
    }

    const { data, error } = await supabase
      .from("catalog_items")
      .insert({
        catalog_id: catalogData.id,
        business_id: userData.business_id,
        name,
        price,
        type,
        status: "active",
        created_by: userData.id,
      })
      .select("id, name, price, type, status, created_at")
      .single();

    if (error) {
      log.error("Failed to create catalog item", {
        code: error.code,
        message: error.message,
      });
      throw new AppError("Failed to create item.", "SERVER_ERROR");
    }

    revalidatePath("/more/catalog");
    revalidatePath("/more");

    return actionSuccess({
      id: data.id,
      name: data.name,
      price: data.price,
      type: data.type,
      status: data.status,
      createdAt: data.created_at,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/** Toggle a catalog item's active/inactive status. */
export async function toggleCatalogItemStatus(
  itemId: string,
  newStatus: "active" | "inactive",
): Promise<MutateCatalogItemResponse> {
  try {
    const uuidParse = z.string().uuid().safeParse(itemId);
    if (!uuidParse.success) {
      throw new AppError("Invalid item ID.", "VALIDATION_FAILED");
    }

    const cookieStore = await cookies();
    const supabase = await createClient();

    const validation = await validateRewardLoopSession(
      supabase,
      cookieStore.get(SESSION_VERSION_COOKIE.name)?.value,
    );
    if (!validation.valid) {
      throw new AppError("Authentication required.", "AUTH_REQUIRED");
    }

    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .single();

    const { data, error } = await supabase
      .from("catalog_items")
      .update({ status: newStatus, updated_by: userData?.id })
      .eq("id", itemId)
      .select("id, name, price, type, status, created_at")
      .single();

    if (error) {
      log.error("Failed to toggle catalog item status", {
        code: error.code,
        message: error.message,
      });
      throw new AppError("Failed to update item.", "SERVER_ERROR");
    }

    revalidatePath("/more/catalog");

    return actionSuccess({
      id: data.id,
      name: data.name,
      price: data.price,
      type: data.type,
      status: data.status,
      createdAt: data.created_at,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/** Fetch current reward rules. */
export async function getRewardRules(): Promise<GetRewardRulesResponse> {
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

    const { data, error } = await supabase
      .from("reward_rules")
      .select("id, reward_percentage, max_redeem_percentage")
      .maybeSingle();

    if (error) {
      log.error("Failed to fetch reward rules", {
        code: error.code,
        message: error.message,
      });
      throw new AppError("Reward rules not found.", "BUSINESS_NOT_FOUND");
    }

    if (!data) {
      return actionSuccess({
        id: "",
        rewardPercentage: 0,
        maxRedeemPercentage: 0,
      });
    }

    return actionSuccess({
      id: data.id,
      rewardPercentage: data.reward_percentage,
      maxRedeemPercentage: data.max_redeem_percentage,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/** Update reward rules. */
export async function updateRewardRules(
  input: RewardRulesInput,
): Promise<UpdateRewardRulesResponse> {
  try {
    const parseResult = rewardRulesSchema.safeParse(input);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new AppError(
        issue?.message ?? "Invalid reward rules.",
        "VALIDATION_FAILED",
      );
    }

    const { rewardPercentage, maxRedeemPercentage } = parseResult.data;
    const cookieStore = await cookies();
    const supabase = await createClient();

    const validation = await validateRewardLoopSession(
      supabase,
      cookieStore.get(SESSION_VERSION_COOKIE.name)?.value,
    );
    if (!validation.valid) {
      throw new AppError("Authentication required.", "AUTH_REQUIRED");
    }

    const { data: userData } = await supabase
      .from("users")
      .select("id, business_id")
      .single();

    if (!userData?.business_id) {
      throw new AppError("Business not found.", "BUSINESS_NOT_FOUND");
    }

    const { data, error } = await supabase
      .from("reward_rules")
      .upsert(
        {
          business_id: userData.business_id,
          reward_percentage: rewardPercentage,
          max_redeem_percentage: maxRedeemPercentage,
          created_by: userData.id,
        },
        { onConflict: "business_id" },
      )
      .select("id, reward_percentage, max_redeem_percentage")
      .single();

    if (error) {
      log.error("Failed to update reward rules", {
        code: error.code,
        message: error.message,
      });
      throw new AppError("Failed to update reward rules.", "SERVER_ERROR");
    }

    revalidatePath("/more/rewards");
    revalidatePath("/more");

    return actionSuccess({
      id: data.id,
      rewardPercentage: data.reward_percentage,
      maxRedeemPercentage: data.max_redeem_percentage,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/** Update business profile. */
export async function updateBusinessProfile(
  input: BusinessProfileInput,
): Promise<UpdateBusinessProfileResponse> {
  try {
    const parseResult = businessProfileSchema.safeParse(input);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new AppError(
        issue?.message ?? "Invalid business profile.",
        "VALIDATION_FAILED",
      );
    }

    const { name } = parseResult.data;
    const cookieStore = await cookies();
    const supabase = await createClient();

    const validation = await validateRewardLoopSession(
      supabase,
      cookieStore.get(SESSION_VERSION_COOKIE.name)?.value,
    );
    if (!validation.valid) {
      throw new AppError("Authentication required.", "AUTH_REQUIRED");
    }

    const { data: userData } = await supabase
      .from("users")
      .select("business_id")
      .single();

    if (!userData?.business_id) {
      throw new AppError("Business not found.", "BUSINESS_NOT_FOUND");
    }

    const { data, error } = await supabase
      .from("businesses")
      .update({ name })
      .eq("id", userData.business_id)
      .select("id, name, business_type, email, gst_number, address")
      .single();

    if (error) {
      log.error("Failed to update business profile", {
        code: error.code,
        message: error.message,
      });
      throw new AppError("Failed to update business profile.", "SERVER_ERROR");
    }

    revalidatePath("/more");

    return actionSuccess({
      id: data.id,
      name: data.name,
      businessType: data.business_type,
      email: data.email,
      gstNumber: data.gst_number,
      address: data.address,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

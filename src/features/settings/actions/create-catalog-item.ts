"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { catalogItemSchema } from "../schemas";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";
import type { CatalogItemInput, MutateCatalogItemResponse } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("create-catalog-item");

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

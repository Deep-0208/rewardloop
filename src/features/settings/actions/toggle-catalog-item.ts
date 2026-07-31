"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";
import { z } from "zod";
import type { MutateCatalogItemResponse } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("toggle-catalog-item");

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

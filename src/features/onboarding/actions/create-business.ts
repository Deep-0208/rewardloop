"use server";

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

import { createBusinessSchema, type CreateBusinessInput } from "../schemas";

import { createLogger } from "@/lib/logger";

const log = createLogger("create-business");

export type CreateBusinessResult = {
  success: boolean;
  message?: string;
  error?: string;
};

/**
 * Creates a new business and associates it with the currently authenticated user.
 */
export async function createBusiness(
  input: CreateBusinessInput,
): Promise<CreateBusinessResult> {
  try {
    // 1. Validate session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in again." };
    }

    // 2. Validate input
    const validatedFields = createBusinessSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid input provided.",
      };
    }

    const {
      name,
      business_type,
      reward_percentage,
      max_redeem_percentage,
      services = [],
      products = [],
    } = validatedFields.data;

    // 3. Use Admin client to call atomic RPC
    const adminSupabase = createAdminClient();

    const { data: rpcData, error: rpcError } = await adminSupabase.rpc(
      "create_business_flow",
      {
        p_auth_user_id: user.id,
        p_name: name,
        p_type: business_type,
        p_reward_pct: reward_percentage,
        p_max_redeem_pct: max_redeem_percentage,
        p_services: services,
        p_products: products,
      },
    );

    if (rpcError) {
      log.error("Failed to execute create_business_flow RPC", {
        error: rpcError,
      });
      return {
        success: false,
        error: "Failed to create business. Please try again.",
      };
    }

    if (!rpcData.success) {
      log.error("RPC returned logic error", {
        error: rpcData.message,
        code: rpcData.code,
      });
      return {
        success: false,
        error: rpcData.message || "An unexpected error occurred.",
      };
    }

    log.info("Business created successfully via RPC", {
      businessId: rpcData.business_id,
    });

    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Business created successfully!",
    };
  } catch (error) {
    log.error("createBusiness unexpected error", { error });
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

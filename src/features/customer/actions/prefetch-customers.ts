"use server";

import { createClient } from "@/lib/supabase/server";
import { Customer } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";
import type { ActionResult } from "@/types/domain";

export async function prefetchCustomers(): Promise<ActionResult<Customer[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED");
    }

    const { data: userData } = await supabase
      .from("users")
      .select("business_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const businessId = userData?.business_id as string | undefined;

    if (!businessId) {
      throw new AppError("Authentication required", "AUTH_REQUIRED");
    }

    const cacheKey = `business:${businessId}:customers_all`;
    const { serverCache } = await import("@/lib/server-cache");

    const customers = await serverCache.fetch(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from("customers")
          .select("id, business_id, phone, name, total_visits")
          .eq("business_id", businessId)
          .limit(5000);

        if (error) {
          throw new AppError("Failed to fetch customers", "SERVER_ERROR");
        }
        return data as Customer[];
      },
      { ttlSeconds: 3600 }
    );

    return actionSuccess(customers);
  } catch (error) {
    return handleActionError(error);
  }
}

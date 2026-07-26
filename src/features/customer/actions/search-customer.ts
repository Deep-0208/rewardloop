"use server";

import { createClient } from "@/lib/supabase/server";
import { findCustomerByPhone } from "../services/customer-service";
import { searchCustomerSchema, SearchCustomerInput, Customer } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";
import type { ActionResult } from "@/types/domain";

export async function searchCustomer(
  input: SearchCustomerInput,
): Promise<ActionResult<Customer | null>> {
  try {
    const parsed = searchCustomerSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Invalid phone number format", "VALIDATION_FAILED");
    }

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

    const customer = await findCustomerByPhone(
      supabase,
      parsed.data.phone,
      businessId,
    );

    return actionSuccess(customer);
  } catch (error) {
    return handleActionError(error);
  }
}

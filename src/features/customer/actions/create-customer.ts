"use server";

import { createClient } from "@/lib/supabase/server";
import { createCustomer as createCustomerService } from "../services/customer-service";
import { createCustomerSchema, CreateCustomerInput, Customer } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";
import type { ActionResult } from "@/types/domain";

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<ActionResult<Customer>> {
  try {
    const parsed = createCustomerSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Invalid customer data", "VALIDATION_FAILED");
    }

    const supabase = await createClient();
    const customer = await createCustomerService(
      supabase,
      parsed.data.phone,
      parsed.data.name,
    );

    return actionSuccess(customer);
  } catch (error) {
    return handleActionError(error);
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { Customer } from "../types";

export async function findCustomerByPhone(
  supabase: SupabaseClient,
  phone: string,
  businessId?: string,
): Promise<Customer | null> {
  let query = supabase
    .from("customers")
    .select("id, business_id, phone, name, total_visits")
    .eq("phone", phone);

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new AppError("Failed to fetch customer", "SERVER_ERROR");
  }

  return data as Customer | null;
}

export async function createCustomer(
  supabase: SupabaseClient,
  phone: string,
  name?: string,
): Promise<Customer> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new AppError("Unauthorized", "AUTH_REQUIRED");
  }

  const { data: userData, error: userFetchError } = await supabase
    .from("users")
    .select("id, business_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (userFetchError || !userData?.business_id || !userData?.id) {
    throw new AppError("User profile not found", "AUTH_REQUIRED");
  }

  const businessId = userData.business_id as string;
  const dbUserId = userData.id as string;

  // Check if customer exists for THIS business first to avoid duplicate records
  const existing = await findCustomerByPhone(supabase, phone, businessId);
  if (existing) {
    throw new AppError(
      "Customer with this phone number already exists.",
      "VALIDATION_FAILED",
    );
  }

  // Atomically insert customer and wallet
  const { data: newCustomer, error: insertError } = await supabase
    .rpc("create_customer_with_wallet", {
      p_phone: phone,
      p_name: name || null,
      p_business_id: businessId,
      p_created_by: dbUserId,
    })
    .single();

  if (insertError) {
    throw new AppError("Failed to create customer and wallet", "SERVER_ERROR");
  }

  return newCustomer as Customer;
}

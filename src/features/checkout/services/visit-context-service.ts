import "server-only";

import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";

const log = createLogger("visit-context");

export interface VisitContext {
  readonly businessId: string;
  readonly userId: string;
  readonly customer: {
    readonly id: string;
    readonly phone: string;
  };
}

function throwSessionError(
  reason: "AUTH_REQUIRED" | "SESSION_REVOKED" | "ACCOUNT_SUSPENDED" | undefined,
): never {
  if (reason === "ACCOUNT_SUSPENDED") {
    throw new AppError("Your account has been suspended.", "ACCOUNT_SUSPENDED");
  }
  if (reason === "SESSION_REVOKED") {
    throw new AppError(
      "Your session is no longer active. Please log in again.",
      "SESSION_REVOKED",
    );
  }
  throw new AppError("Authentication required.", "AUTH_REQUIRED");
}

/** Resolves the authenticated staff member and an in-business customer. */
export async function resolveVisitContext(
  supabase: SupabaseClient,
  customerId: string,
): Promise<VisitContext> {
  const cookieStore = await cookies();
  const validation = await validateRewardLoopSession(
    supabase,
    cookieStore.get(SESSION_VERSION_COOKIE.name)?.value,
  );
  if (!validation.valid || !validation.user)
    throwSessionError(validation.reason);

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, business_id")
    .eq("auth_user_id", validation.user.id)
    .maybeSingle();
  if (userError) {
    log.error("Unable to resolve visit user", { code: userError.code });
    throw new AppError("Unable to load business details.", "SERVER_ERROR");
  }
  if (!user?.business_id || !user.id) {
    throw new AppError("Business not found.", "BUSINESS_NOT_FOUND");
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, phone")
    .eq("id", customerId)
    .eq("business_id", user.business_id)
    .maybeSingle();
  if (customerError) {
    log.error("Unable to resolve visit customer", { code: customerError.code });
    throw new AppError("Unable to load customer details.", "SERVER_ERROR");
  }
  if (!customer?.phone)
    throw new AppError("Customer not found.", "CUSTOMER_NOT_FOUND");

  return {
    businessId: user.business_id as string,
    userId: user.id as string,
    customer: { id: customer.id as string, phone: customer.phone as string },
  };
}

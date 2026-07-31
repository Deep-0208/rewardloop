/**
 * Reward calculation data service.
 *
 * It deliberately re-reads live wallet, reward-rule, and catalog values so
 * the browser never becomes the financial source of truth.
 */

import "server-only";

import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateBill } from "@/lib/billing/billing-math";
import { AppError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import type { RewardCalculationInput, RewardSummary } from "../types";

const log = createLogger("reward-calculation");

interface RewardContext {
  readonly businessId: string;
  readonly customerId: string;
  readonly walletBalancePaise: number;
  readonly rewardPercentage: number;
  readonly maxRedeemPercentage: number;
}

function throwSessionError(
  reason: "AUTH_REQUIRED" | "SESSION_REVOKED" | "ACCOUNT_SUSPENDED" | "SESSION_EXPIRED" | undefined,
): never {
  if (reason === "ACCOUNT_SUSPENDED") {
    throw new AppError("Your account has been suspended.", "ACCOUNT_SUSPENDED");
  }
  if (reason === "SESSION_EXPIRED") {
    throw new AppError("Your session has expired. Please log in again.", "SESSION_EXPIRED");
  }
  if (reason === "SESSION_REVOKED") {
    throw new AppError(
      "Your session is no longer active. Please log in again.",
      "SESSION_REVOKED",
    );
  }
  throw new AppError("Authentication required.", "AUTH_REQUIRED");
}

async function getRewardContext(
  supabase: SupabaseClient,
  customerId: string,
): Promise<RewardContext> {
  const cookieStore = await cookies();
  const validation = await validateRewardLoopSession(
    supabase,
    cookieStore.get(SESSION_VERSION_COOKIE.name)?.value,
  );

  if (!validation.valid || !validation.user) {
    return throwSessionError(validation.reason);
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("business_id")
    .eq("auth_user_id", validation.user.id)
    .maybeSingle();

  if (userError) {
    log.error("Unable to resolve the authenticated business", {
      code: userError.code,
    });
    throw new AppError("Unable to load business details.", "SERVER_ERROR");
  }
  if (!user?.business_id) {
    throw new AppError("Business not found.", "BUSINESS_NOT_FOUND");
  }

  const businessId = user.business_id as string;
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (customerError) {
    log.error("Unable to resolve reward customer", {
      code: customerError.code,
    });
    throw new AppError("Unable to load customer details.", "SERVER_ERROR");
  }
  if (!customer) {
    throw new AppError("Customer not found.", "CUSTOMER_NOT_FOUND");
  }

  const [walletResult, rulesResult] = await Promise.all([
    supabase
      .from("reward_wallets")
      .select("current_balance")
      .eq("customer_id", customerId)
      .eq("business_id", businessId)
      .maybeSingle(),
    supabase
      .from("reward_rules")
      .select("reward_percentage, max_redeem_percentage")
      .eq("business_id", businessId)
      .maybeSingle(),
  ]);

  if (walletResult.error || rulesResult.error) {
    log.error("Unable to load reward calculation context", {
      walletCode: walletResult.error?.code,
      rulesCode: rulesResult.error?.code,
    });
    throw new AppError("Unable to load reward details.", "SERVER_ERROR");
  }
  if (!walletResult.data) {
    throw new AppError(
      "Customer reward wallet was not found.",
      "WALLET_INSUFFICIENT",
    );
  }
  if (!rulesResult.data) {
    throw new AppError("Reward rules were not found.", "BUSINESS_NOT_FOUND");
  }

  return {
    businessId,
    customerId,
    walletBalancePaise: walletResult.data.current_balance as number,
    rewardPercentage: rulesResult.data.reward_percentage as number,
    maxRedeemPercentage: rulesResult.data.max_redeem_percentage as number,
  };
}

async function getVerifiedBillItems(
  supabase: SupabaseClient,
  businessId: string,
  input: RewardCalculationInput,
) {
  const catalogItemIds = input.items.map((item) => item.catalogItemId);
  const { data, error } = await supabase
    .from("catalog_items")
    .select("id, price")
    .eq("business_id", businessId)
    .eq("status", "active")
    .in("id", catalogItemIds);

  if (error) {
    log.error("Unable to verify catalog prices", { code: error.code });
    throw new AppError(
      "Unable to verify selected catalog items.",
      "SERVER_ERROR",
    );
  }
  if (!data || data.length !== catalogItemIds.length) {
    throw new AppError(
      "One or more selected services are no longer available.",
      "CATALOG_ITEM_NOT_FOUND",
    );
  }

  const priceById = new Map(
    data.map((item) => [item.id as string, item.price as number]),
  );

  return input.items.map((item) => {
    const unitPricePaise = priceById.get(item.catalogItemId);
    if (unitPricePaise === undefined) {
      throw new AppError(
        "One or more selected services are no longer available.",
        "CATALOG_ITEM_NOT_FOUND",
      );
    }
    return { unitPricePaise, quantity: item.quantity };
  });
}

/** Calculate a server-authoritative reward summary without changing a wallet. */
export async function calculateRewardSummary(
  supabase: SupabaseClient,
  input: RewardCalculationInput,
): Promise<RewardSummary> {
  const context = await getRewardContext(supabase, input.customerId);
  const items = await getVerifiedBillItems(supabase, context.businessId, input);
  const calculation = calculateBill({
    items,
    walletBalancePaise: context.walletBalancePaise,
    maxRedeemPercentage: context.maxRedeemPercentage,
    rewardPercentage: context.rewardPercentage,
    rewardAppliedPaise: input.rewardRequestedPaise,
  });

  return {
    customerId: context.customerId,
    walletBalancePaise: context.walletBalancePaise,
    newWalletBalancePaise: calculation.newWalletBalancePaise,
    rewardPercentage: context.rewardPercentage,
    maxRedeemPercentage: context.maxRedeemPercentage,
    subtotalPaise: calculation.subtotalPaise,
    maxRedeemPaise: calculation.maxRedeemPaise,
    rewardRequestedPaise: input.rewardRequestedPaise,
    rewardAppliedPaise: calculation.rewardAppliedPaise,
    finalPaidPaise: calculation.finalPaidPaise,
    rewardEarnedPaise: calculation.rewardEarnedPaise,
    requiresOtp: calculation.rewardAppliedPaise > 0,
  };
}

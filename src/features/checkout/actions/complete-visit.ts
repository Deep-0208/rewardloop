"use server";

import { actionSuccess } from "@/lib/api";
import { AppError, handleActionError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { completeVisitSchema } from "../schemas";
import { validateVisitCompletion } from "../engine/complete-visit-validation";
import { generateServerCheckoutSummary } from "../services/checkout-summary-service";
import { resolveVisitContext } from "../services/visit-context-service";
import type {
  CompleteVisitInput,
  CompleteVisitResponse,
  CompleteVisitResult,
} from "../types";

import { checkoutRateLimit } from "@/lib/rate-limit";

const log = createLogger("complete-visit");

interface CompleteVisitRpcRow {
  transaction_id: string;
  subtotal: number;
  reward_used: number;
  reward_earned: number;
  final_paid: number;
  new_wallet_balance: number;
  duplicate: boolean;
}

/** Commits a visit through the single atomic database transaction RPC. */
export async function completeVisit(
  input: CompleteVisitInput,
): Promise<CompleteVisitResponse> {
  try {
    const parsed = completeVisitSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(" ");
      throw new AppError(
        messages || "Invalid visit completion request.",
        "VALIDATION_FAILED",
      );
    }

    const supabase = await createClient();
    const context = await resolveVisitContext(supabase, parsed.data.customerId);

    const rateLimitResult = await checkoutRateLimit.limit(
      `checkout_${context.businessId}`,
    );
    if (!rateLimitResult.success) {
      throw new AppError(
        "Too many checkout attempts. Please wait a moment before trying again.",
        "RATE_LIMITED",
      );
    }
    const summary = await generateServerCheckoutSummary(supabase, {
      customerId: parsed.data.customerId,
      items: parsed.data.items,
      rewardRequestedPaise: parsed.data.rewardAppliedPaise,
    });
    validateVisitCompletion({
      finalPayablePaise: summary.finalPayablePaise,
      rewardAppliedPaise: summary.rewardUsedPaise,
      paymentMethod: parsed.data.paymentMethod,
      otpVerifiedToken: parsed.data.otpVerifiedToken,
    });

    const { data, error } = await supabase.rpc("complete_visit", {
      p_idempotency_key: parsed.data.idempotencyKey,
      p_customer_id: parsed.data.customerId,
      p_items: parsed.data.items.map((item) => ({
        catalog_item_id: item.catalogItemId,
        quantity: item.quantity,
      })),
      p_reward_applied: summary.rewardUsedPaise,
      p_payment_method: parsed.data.paymentMethod,
      p_otp_verified_token: parsed.data.otpVerifiedToken,
      p_business_id: context.businessId,
      p_created_by: context.userId,
    });
    if (error) {
      log.error("Atomic complete_visit RPC failed", {
        code: error.code,
        message: error.message,
      });
      throw new AppError(
        error.code === "22023"
          ? error.message
          : "Unable to complete this visit. No changes were saved.",
        "TRANSACTION_FAILED",
      );
    }

    const row = (data as CompleteVisitRpcRow[] | null)?.[0];
    if (!row?.transaction_id) {
      throw new AppError(
        "Unable to complete this visit. No changes were saved.",
        "TRANSACTION_FAILED",
      );
    }

    const result: CompleteVisitResult = {
      transactionId: row.transaction_id,
      subtotalPaise: row.subtotal,
      rewardUsedPaise: row.reward_used,
      rewardEarnedPaise: row.reward_earned,
      finalPaidPaise: row.final_paid,
      walletBalancePaise: row.new_wallet_balance,
      duplicate: row.duplicate,
    };
    if (!result.duplicate) {
      // Async fire-and-forget for SMS notification to prevent blocking POS checkout response
      void (async () => {
        try {
          const { error: notificationError } = await supabase.functions.invoke(
            "send-transaction-sms",
            {
              body: {
                customerId: parsed.data.customerId,
                transactionId: result.transactionId,
                finalPaidPaise: result.finalPaidPaise,
                rewardEarnedPaise: result.rewardEarnedPaise,
                rewardUsedPaise: result.rewardUsedPaise,
              },
            },
          );
          if (notificationError) {
            log.error("Transaction SMS notification failed", {
              transactionId: result.transactionId,
              message: notificationError.message,
            });
          }
        } catch (smsError) {
          log.error("Transaction SMS service unreachable", {
            transactionId: result.transactionId,
            error:
              smsError instanceof Error ? smsError.message : "Unknown error",
          });
        }
      })();
    }
    return actionSuccess(result);
  } catch (error) {
    return handleActionError(error);
  }
}


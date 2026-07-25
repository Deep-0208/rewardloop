import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { calculateRewardSummary } from "@/features/reward/services/reward-calculation-service";
import { checkoutCatalogItemSchema } from "../schemas";
import { calculateCheckoutSummary } from "../engine/checkout-summary-engine";
import type { CheckoutSummary, CheckoutSummaryInput } from "../types";

const log = createLogger("checkout-summary");

/** Build a fresh server-authoritative checkout review without persisting data. */
export async function generateServerCheckoutSummary(
  supabase: SupabaseClient,
  input: CheckoutSummaryInput,
): Promise<CheckoutSummary> {
  const reward = await calculateRewardSummary(supabase, input);
  const catalogItemIds = input.items.map((item) => item.catalogItemId);
  const { data, error } = await supabase
    .from("catalog_items")
    .select("id, name, type, price")
    .eq("status", "active")
    .in("id", catalogItemIds);

  if (error) {
    log.error("Unable to load checkout line items", { code: error.code });
    throw new AppError("Unable to load checkout details.", "SERVER_ERROR");
  }

  const catalogItems = checkoutCatalogItemSchema.array().safeParse(data);
  if (
    !catalogItems.success ||
    catalogItems.data.length !== input.items.length
  ) {
    throw new AppError(
      "One or more selected services are no longer available.",
      "CATALOG_ITEM_NOT_FOUND",
    );
  }

  const itemById = new Map(catalogItems.data.map((item) => [item.id, item]));
  const lines = input.items.map((inputItem) => {
    const item = itemById.get(inputItem.catalogItemId);
    if (!item) {
      throw new AppError(
        "One or more selected services are no longer available.",
        "CATALOG_ITEM_NOT_FOUND",
      );
    }

    return {
      catalogItemId: item.id,
      name: item.name,
      type: item.type,
      unitPricePaise: item.price,
      quantity: inputItem.quantity,
      totalPaise: 0,
    };
  });

  try {
    return calculateCheckoutSummary({
      customerId: input.customerId,
      items: lines,
      reward,
    });
  } catch (error) {
    log.error("Checkout calculation did not match reward summary", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    throw new AppError(
      "Checkout calculation changed. Please review the bill.",
      "VALIDATION_FAILED",
    );
  }
}

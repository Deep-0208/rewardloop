/**
 * RewardLoop — Transaction History Service.
 *
 * Server-only data access for the transaction history page.
 *
 * @module features/transactions/services/transaction-service
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createLogger } from "@/lib/logger";
import type { TransactionRow } from "../types";

const log = createLogger("transactions");

/**
 * Fetch transactions for the current business, most recent first.
 *
 * RLS enforces business_id = auth_business_id().
 * Joins customers for display name/phone.
 * Joins transaction_items to get item count per transaction.
 *
 * @param supabase - Authenticated Supabase server client
 * @param limit - Max number of transactions to fetch (default 50)
 * @returns Array of TransactionRow DTOs
 * @throws On database errors
 */
export async function getTransactionHistory(
  supabase: SupabaseClient,
  limit = 50,
): Promise<TransactionRow[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      id,
      subtotal,
      reward_used,
      reward_earned,
      final_paid,
      payment_method,
      created_at,
      customers!inner ( name, phone ),
      transaction_items ( id, quantity, unit_price, catalog_item_type )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    log.error("Failed to fetch transactions", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  return (data ?? []).map((row) => {
    const customer = Array.isArray(row.customers)
      ? row.customers[0]
      : row.customers;
    const items =
      (row.transaction_items as Array<{
        id: string;
        quantity: number;
        unit_price: number;
        catalog_item_type: "service" | "product";
      }>) || [];

    let serviceSubtotalPaise = 0;
    let productSubtotalPaise = 0;
    for (const item of items) {
      if (item.catalog_item_type === "product") {
        productSubtotalPaise += item.quantity * item.unit_price;
      } else {
        serviceSubtotalPaise += item.quantity * item.unit_price;
      }
    }

    return {
      id: row.id,
      customerName: customer?.name ?? null,
      customerPhone: customer?.phone ?? "",
      subtotalPaise: row.subtotal,
      serviceSubtotalPaise,
      productSubtotalPaise,
      rewardUsedPaise: row.reward_used,
      rewardEarnedPaise: row.reward_earned,
      finalPaidPaise: row.final_paid,
      paymentMethod: row.payment_method as "cash" | "online" | "none",
      createdAt: row.created_at,
      itemCount: items.length,
    };
  });
}

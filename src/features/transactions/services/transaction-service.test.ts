import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("server-only", () => ({}));

import { getTransactionHistory } from "./transaction-service";

describe("transaction-service", () => {
  it("should map database rows correctly to TransactionRow DTOs", async () => {
    const mockData = [
      {
        id: "txn-1",
        subtotal: 1000,
        reward_used: 100,
        reward_earned: 50,
        final_paid: 900,
        payment_method: "online",
        created_at: "2026-07-26T12:00:00Z",
        customers: [{ name: "Alice", phone: "+1234567890" }], // Array from join
        transaction_items: [{ id: "item-1" }, { id: "item-2" }], // Array from join
      },
      {
        id: "txn-2",
        subtotal: 500,
        reward_used: 0,
        reward_earned: 25,
        final_paid: 500,
        payment_method: "cash",
        created_at: "2026-07-26T12:30:00Z",
        customers: { name: null, phone: "+0987654321" }, // Object from inner join
        transaction_items: null, // Null items
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await getTransactionHistory(mockSupabase, 10);

    expect(result).toHaveLength(2);

    // Test first row (Array format for customer and items)
    expect(result[0]).toEqual({
      id: "txn-1",
      customerName: "Alice",
      customerPhone: "+1234567890",
      subtotalPaise: 1000,
      rewardUsedPaise: 100,
      rewardEarnedPaise: 50,
      finalPaidPaise: 900,
      paymentMethod: "online",
      createdAt: "2026-07-26T12:00:00Z",
      itemCount: 2,
    });

    // Test second row (Object format for customer and null items)
    expect(result[1]).toEqual({
      id: "txn-2",
      customerName: null,
      customerPhone: "+0987654321",
      subtotalPaise: 500,
      rewardUsedPaise: 0,
      rewardEarnedPaise: 25,
      finalPaidPaise: 500,
      paymentMethod: "cash",
      createdAt: "2026-07-26T12:30:00Z",
      itemCount: 0,
    });
  });

  it("should throw an error if database query fails", async () => {
    const mockError = { code: "500", message: "Database failure" };
    
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    await expect(getTransactionHistory(mockSupabase, 10)).rejects.toEqual(mockError);
  });
});

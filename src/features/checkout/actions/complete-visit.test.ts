import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only module
vi.mock("server-only", () => ({}));

// Mock Supabase server client loader
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock checkout rate limit
vi.mock("@/lib/rate-limit", () => ({
  checkoutRateLimit: {
    limit: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock visit context resolution
vi.mock("../services/visit-context-service", () => ({
  resolveVisitContext: vi.fn().mockResolvedValue({
    businessId: "123e4567-e89b-12d3-a456-426614174099",
    userId: "123e4567-e89b-12d3-a456-426614174098",
  }),
}));

// Mock server checkout summary generation
vi.mock("../services/checkout-summary-service", () => ({
  generateServerCheckoutSummary: vi.fn().mockResolvedValue({
    finalPayablePaise: 8000,
    rewardUsedPaise: 0,
    serviceSubtotalPaise: 8000,
    productSubtotalPaise: 0,
  }),
}));

import { completeVisit } from "./complete-visit";
import { createClient } from "@/lib/supabase/server";
import { checkoutRateLimit } from "@/lib/rate-limit";

describe("completeVisit Action", () => {
  let mockSupabase: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            transaction_id: "txn-999",
            subtotal: 8000,
            reward_used: 0,
            reward_earned: 800,
            final_paid: 8000,
            new_wallet_balance: 800,
            duplicate: false,
          },
        ],
        error: null,
      }),
      functions: {
        invoke: vi.fn().mockResolvedValue({ error: null }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });

  it("should fail validation if customerId is invalid UUID", async () => {
    const response = await completeVisit({
      idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
      customerId: "invalid-uuid",
      items: [
        {
          catalogItemId: "123e4567-e89b-12d3-a456-426614174001",
          quantity: 1,
        },
      ],
      paymentMethod: "cash",
      rewardAppliedPaise: 0,
      otpVerifiedToken: null,
    });

    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.code).toBe("VALIDATION_FAILED");
    }
  });

  it("should return RATE_LIMITED error if checkout rate limiter triggers", async () => {
    vi.mocked(checkoutRateLimit.limit).mockResolvedValueOnce({ success: false } as never);

    const response = await completeVisit({
      idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
      customerId: "123e4567-e89b-12d3-a456-426614174002",
      items: [
        {
          catalogItemId: "123e4567-e89b-12d3-a456-426614174001",
          quantity: 1,
        },
      ],
      paymentMethod: "cash",
      rewardAppliedPaise: 0,
      otpVerifiedToken: null,
    });

    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.code).toBe("RATE_LIMITED");
    }
  });

  it("should execute complete_visit RPC and return success when valid", async () => {
    const response = await completeVisit({
      idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
      customerId: "123e4567-e89b-12d3-a456-426614174002",
      items: [
        {
          catalogItemId: "123e4567-e89b-12d3-a456-426614174001",
          quantity: 1,
        },
      ],
      paymentMethod: "cash",
      rewardAppliedPaise: 0,
      otpVerifiedToken: null,
    });

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.transactionId).toBe("txn-999");
      expect(response.data.finalPaidPaise).toBe(8000);
      expect(response.data.rewardEarnedPaise).toBe(800);
    }
  });
});

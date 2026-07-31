import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createBusiness } from "./create-business";
import { createClient } from "@/lib/supabase/server";

describe("createBusiness Action", () => {
  let mockSupabase: {
    auth: { getUser: ReturnType<typeof vi.fn> };
    rpc: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123", email: "merchant@example.com" } },
          error: null,
        }),
      },
      rpc: vi.fn().mockResolvedValue({
        data: { success: true, business_id: "biz-456" },
        error: null,
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });

  it("should return error if user is unauthenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const result = await createBusiness({
      name: "Test Salon",
      business_type: "salon",
      reward_percentage: 10,
      max_redeem_percentage: 20,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should return error if business name is empty", async () => {
    const result = await createBusiness({
      name: "",
      business_type: "salon",
      reward_percentage: 10,
      max_redeem_percentage: 20,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid input");
  });

  it("should successfully call RPC create_business_flow when valid", async () => {
    const result = await createBusiness({
      name: "Grand Salon",
      business_type: "salon",
      reward_percentage: 10,
      max_redeem_percentage: 20,
      services: [{ name: "Haircut", price: 5000 }],
      products: [],
    });

    expect(result.success).toBe(true);
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      "create_business_flow",
      expect.objectContaining({
        p_auth_user_id: "user-123",
        p_name: "Grand Salon",
        p_type: "salon",
        p_reward_pct: 10,
        p_max_redeem_pct: 20,
      }),
    );
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isOtpRateLimited, setOtpCooldownCookie } from "./otp-cooldown";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env.server";

// Mock dependencies
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/env.server", () => ({
  getServerEnv: vi.fn(),
}));

describe("otp-cooldown", () => {
  const MOCK_SECRET = "test-secret-key-123";
  let mockCookieStore: any;
  let mockRpc: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T12:00:00Z"));

    mockCookieStore = {
      get: vi.fn(),
      set: vi.fn(),
    };
    (cookies as any).mockResolvedValue(mockCookieStore);

    mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });
    (createAdminClient as any).mockReturnValue({
      rpc: mockRpc,
    });

    (getServerEnv as any).mockReturnValue({
      REWARDLOOP_SESSION_SECRET: MOCK_SECRET,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  async function generateSignedCookie(timestamp: number): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(MOCK_SECRET);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const timestampStr = timestamp.toString();
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(timestampStr),
    );
    const hexSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `${timestampStr}.${hexSignature}`;
  }

  it("should return true (rate limited) if valid cookie exists and within 30s cooldown", async () => {
    const now = Date.now();
    const signedValue = await generateSignedCookie(now - 10000); // 10s ago

    mockCookieStore.get.mockReturnValue({ value: signedValue });

    const result = await isOtpRateLimited("+1234567890");

    expect(result).toBe(true);
    expect(mockRpc).not.toHaveBeenCalled(); // Fast path hit
  });

  it("should fallback to DB if cookie timestamp is older than 30s", async () => {
    const now = Date.now();
    const signedValue = await generateSignedCookie(now - 35000); // 35s ago

    mockCookieStore.get.mockReturnValue({ value: signedValue });
    mockRpc.mockResolvedValue({ data: true, error: null }); // DB says allowed = true

    const result = await isOtpRateLimited("+1234567890");

    expect(result).toBe(false); // allowed = true means rateLimited = false
    expect(mockRpc).toHaveBeenCalled();
  });

  it("should fallback to DB if cookie is tampered", async () => {
    const now = Date.now();
    const signedValue = await generateSignedCookie(now - 10000);
    const tamperedValue = signedValue.replace(/\d/, "9"); // Change timestamp

    mockCookieStore.get.mockReturnValue({ value: tamperedValue });
    mockRpc.mockResolvedValue({ data: false, error: null }); // DB says allowed = false (rate limited)

    const result = await isOtpRateLimited("+1234567890");

    expect(result).toBe(true); // allowed = false means rateLimited = true
    expect(mockRpc).toHaveBeenCalled();
  });

  it("should allow request if DB fails due to RPC error", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    mockRpc.mockResolvedValue({ data: null, error: new Error("DB Error") });

    const result = await isOtpRateLimited("+1234567890");

    expect(result).toBe(false); // Fail open
  });

  it("should set signed cookie correctly", async () => {
    await setOtpCooldownCookie();

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "rl_otp_lock",
      expect.stringMatching(/^\d+\.[a-f0-9]{64}$/),
      expect.objectContaining({ maxAge: 30 }),
    );
  });
});

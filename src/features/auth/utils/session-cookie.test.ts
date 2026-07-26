import { describe, it, expect } from "vitest";
import { signSessionVersion, parseAndVerifySessionVersion } from "./session-cookie";

describe("session-cookie", () => {
  const MOCK_SECRET = "super-secret-key-for-testing-12345";

  it("should generate a valid signature and parse it correctly", async () => {
    const version = 1;
    const signedValue = await signSessionVersion(version, MOCK_SECRET);
    
    // Format should be "version.signature"
    expect(signedValue).toMatch(/^1\.[a-f0-9]{64}$/);

    const parsedVersion = await parseAndVerifySessionVersion(signedValue, MOCK_SECRET);
    expect(parsedVersion).toBe(version);
  });

  it("should return null for tampered version", async () => {
    const version = 1;
    const signedValue = await signSessionVersion(version, MOCK_SECRET);
    
    // Tamper with the version part
    const tamperedValue = signedValue.replace(/^1\./, "2.");
    const parsedVersion = await parseAndVerifySessionVersion(tamperedValue, MOCK_SECRET);
    
    expect(parsedVersion).toBeNull();
  });

  it("should return null for tampered signature", async () => {
    const version = 1;
    const signedValue = await signSessionVersion(version, MOCK_SECRET);
    
    // Tamper with the signature part
    const tamperedValue = signedValue.slice(0, -1) + (signedValue.endsWith("a") ? "b" : "a");
    const parsedVersion = await parseAndVerifySessionVersion(tamperedValue, MOCK_SECRET);
    
    expect(parsedVersion).toBeNull();
  });

  it("should return null for missing or completely invalid cookie", async () => {
    expect(await parseAndVerifySessionVersion(undefined, MOCK_SECRET)).toBeNull();
    expect(await parseAndVerifySessionVersion(null, MOCK_SECRET)).toBeNull();
    expect(await parseAndVerifySessionVersion("", MOCK_SECRET)).toBeNull();
    expect(await parseAndVerifySessionVersion("just-a-string", MOCK_SECRET)).toBeNull();
    expect(await parseAndVerifySessionVersion("1.part2.part3", MOCK_SECRET)).toBeNull();
  });

  it("should return null for invalid version numbers", async () => {
    // Version is NaN
    expect(await parseAndVerifySessionVersion("abc.signature", MOCK_SECRET)).toBeNull();
    // Version is < 1
    expect(await parseAndVerifySessionVersion("0.signature", MOCK_SECRET)).toBeNull();
    expect(await parseAndVerifySessionVersion("-1.signature", MOCK_SECRET)).toBeNull();
  });

  it("should throw if secret is missing", async () => {
    // Override environment for this test
    const originalSecret = process.env.REWARDLOOP_SESSION_SECRET;
    delete process.env.REWARDLOOP_SESSION_SECRET;
    
    await expect(signSessionVersion(1)).rejects.toThrow("REWARDLOOP_SESSION_SECRET is required");
    
    // Restore
    if (originalSecret) {
      process.env.REWARDLOOP_SESSION_SECRET = originalSecret;
    }
  });
});

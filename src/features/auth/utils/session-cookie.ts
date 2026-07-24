/**
 * RewardLoop — Signed Session Cookie Utilities.
 *
 * Provides HMAC SHA-256 signing and verification for device session versioning (`rl_sv`).
 * Prevents client-side tampering of the session version cookie.
 *
 * @module features/auth/utils/session-cookie
 */

export const SESSION_VERSION_COOKIE = {
  name: "rl_sv",
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
} as const;

function getSecretKey(customSecret?: string): string {
  const secret = customSecret || process.env.REWARDLOOP_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "REWARDLOOP_SESSION_SECRET is required and cannot be empty.",
    );
  }
  return secret;
}

/**
 * Computes HMAC SHA-256 signature for a session version number and returns formatted `version.signature`.
 */
export async function signSessionVersion(
  version: number,
  customSecret?: string,
): Promise<string> {
  const secret = getSecretKey(customSecret);
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(version.toString()),
  );
  const hexSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${version}.${hexSignature}`;
}

/**
 * Parses and verifies an `rl_sv` cookie value.
 * Returns the version number if signature is valid, or `null` if missing, corrupted, or tampered.
 */
export async function parseAndVerifySessionVersion(
  cookieValue: string | undefined | null,
  customSecret?: string,
): Promise<number | null> {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;

  const [versionStr] = parts;
  const version = parseInt(versionStr ?? "", 10);
  if (isNaN(version) || version < 1) return null;

  const expectedSignedValue = await signSessionVersion(version, customSecret);
  if (cookieValue !== expectedSignedValue) return null;

  return version;
}

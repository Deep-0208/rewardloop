/**
 * RewardLoop — Validation regex patterns.
 *
 * Used in Zod schemas and input validation.
 */

export const REGEX = {
  /** Indian mobile number: 10 digits starting with 6-9 */
  PHONE: /^[6-9]\d{9}$/,

  /** 6-digit OTP code */
  OTP: /^\d{6}$/,

  /** UUID v4 format */
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  /** Digits only */
  DIGITS_ONLY: /^\d+$/,

  /** Business name: letters, numbers, spaces, basic punctuation */
  BUSINESS_NAME: /^[\w\s&'.,-]+$/,
} as const;

/**
 * RewardLoop — Core domain types.
 *
 * Canonical type aliases and shared interfaces.
 * Source: 07_Application_Architecture.md §10
 */

/** E.164 phone number string, e.g. "+91XXXXXXXXXX" */
export type PhoneNumber = string;

/** UUID v4 string */
export type UUID = string;

/** Monetary value in paise (integer). 1 INR = 100 paise. */
export type Paise = number;

/** ISO 8601 timestamp string */
export type Timestamp = string;

/* ─── Error Codes ─────────────────────────────────────────────────────────── */

export type ErrorCode =
  | "AUTH_REQUIRED"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED"
  | "INVALID_OTP"
  | "OTP_EXPIRED"
  | "OTP_MAX_ATTEMPTS"
  | "RATE_LIMITED"
  | "CUSTOMER_NOT_FOUND"
  | "CUSTOMER_AUTO_CREATED"
  | "BUSINESS_NOT_FOUND"
  | "CATALOG_ITEM_NOT_FOUND"
  | "REWARD_LIMIT_EXCEEDED"
  | "WALLET_INSUFFICIENT"
  | "VALIDATION_FAILED"
  | "DUPLICATE_TRANSACTION"
  | "TRANSACTION_FAILED"
  | "EDIT_WINDOW_EXPIRED"
  | "EDIT_FIELD_NOT_ALLOWED"
  | "OFFLINE"
  | "SERVER_ERROR";

/* ─── ActionResult ────────────────────────────────────────────────────────── */

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode };

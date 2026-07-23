/**
 * RewardLoop — User-facing error messages.
 *
 * Single source of truth for mapping ErrorCode → human-readable message.
 * All UI-facing error text comes from here.
 */

import type { ErrorCode } from "@/types/domain";

const ERROR_MESSAGE_MAP: Record<ErrorCode, string> = {
  AUTH_REQUIRED: "Please log in to continue.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  SESSION_REVOKED:
    "You've been logged in on another device. Please log in again.",
  INVALID_OTP: "The OTP code is incorrect. Please try again.",
  OTP_EXPIRED: "This OTP has expired. Please request a new one.",
  OTP_MAX_ATTEMPTS: "Too many incorrect attempts. Please request a new OTP.",
  OTP_REQUIRED: "OTP verification is required to redeem rewards.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  CUSTOMER_NOT_FOUND: "Customer not found.",
  CUSTOMER_AUTO_CREATED: "New customer created.",
  BUSINESS_NOT_FOUND: "Business not found.",
  CATALOG_ITEM_NOT_FOUND: "This service is no longer available.",
  REWARD_LIMIT_EXCEEDED: "Reward amount exceeds the maximum allowed.",
  WALLET_INSUFFICIENT: "Insufficient reward balance.",
  VALIDATION_FAILED: "Please check your input and try again.",
  DUPLICATE_TRANSACTION: "This transaction has already been recorded.",
  TRANSACTION_FAILED: "Transaction could not be completed. Please try again.",
  EDIT_WINDOW_EXPIRED: "The edit window for this transaction has expired.",
  EDIT_FIELD_NOT_ALLOWED: "This field cannot be edited.",
  ACCOUNT_SUSPENDED: "Your account has been suspended. Please contact support.",
  OFFLINE: "You appear to be offline. Please check your connection.",
  SERVER_ERROR: "Something went wrong. Please try again.",
};

/**
 * Get a user-friendly error message for an error code.
 *
 * @param code - The machine-readable error code
 * @returns Human-readable error message suitable for UI display
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGE_MAP[code];
}

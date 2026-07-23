/**
 * RewardLoop — Application error class and utilities.
 *
 * Provides a typed error class, type guard, and catch-all handler
 * for consistent error handling across Server Actions.
 */

import type { ActionResult, ErrorCode } from "@/types/domain";

/** HTTP status code mapping for error codes */
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  AUTH_REQUIRED: 401,
  SESSION_EXPIRED: 401,
  SESSION_REVOKED: 401,
  INVALID_OTP: 422,
  OTP_EXPIRED: 422,
  OTP_MAX_ATTEMPTS: 422,
  OTP_REQUIRED: 422,
  RATE_LIMITED: 429,
  CUSTOMER_NOT_FOUND: 404,
  CUSTOMER_AUTO_CREATED: 200,
  BUSINESS_NOT_FOUND: 404,
  CATALOG_ITEM_NOT_FOUND: 404,
  REWARD_LIMIT_EXCEEDED: 422,
  WALLET_INSUFFICIENT: 422,
  VALIDATION_FAILED: 422,
  DUPLICATE_TRANSACTION: 200,
  TRANSACTION_FAILED: 500,
  EDIT_WINDOW_EXPIRED: 422,
  EDIT_FIELD_NOT_ALLOWED: 422,
  ACCOUNT_SUSPENDED: 401,
  OFFLINE: 503,
  SERVER_ERROR: 500,
};

/**
 * Application error with typed error code and HTTP status.
 *
 * Use instead of raw `Error` in Server Actions and services.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code];
  }
}

/** Type guard for AppError instances */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Catch-all error handler for Server Actions.
 *
 * Converts any thrown error into a safe `ActionResult<never>`.
 * AppErrors preserve their code; unknown errors map to SERVER_ERROR.
 */
export function handleActionError(error: unknown): ActionResult<never> {
  if (isAppError(error)) {
    return { success: false, error: error.message, code: error.code };
  }

  // Log unexpected errors for debugging
  // eslint-disable-next-line no-console
  console.error("[handleActionError] Unexpected error:", error);

  return {
    success: false,
    error: "An unexpected error occurred. Please try again.",
    code: "SERVER_ERROR",
  };
}

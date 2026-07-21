/**
 * RewardLoop — ActionResult helpers.
 *
 * Consistent Server Action return type with factory functions.
 * Source: 07_Application_Architecture.md §13
 */

import type { ActionResult, ErrorCode } from "@/types/domain";

/** Create a successful ActionResult */
export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/** Create a failed ActionResult */
export function actionError(
  error: string,
  code: ErrorCode,
): ActionResult<never> {
  return { success: false, error, code };
}

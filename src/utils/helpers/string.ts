/**
 * RewardLoop — String helper utilities.
 */

/**
 * Truncate a string to a maximum length with ellipsis.
 *
 * @param str - The string to truncate
 * @param max - Maximum character length (including ellipsis)
 * @returns Truncated string with "…" appended if exceeded
 */
export function truncateText(str: string, max: number): string {
  if (str.length <= max) return str;
  return `${str.slice(0, max - 1)}…`;
}

/**
 * Generate a cryptographically secure UUID v4.
 *
 * Uses the Web Crypto API (available in Node.js 19+ and all modern browsers).
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Promisified delay. Use for development/testing only.
 *
 * @param ms - Milliseconds to wait
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

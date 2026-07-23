/**
 * RewardLoop — Number formatting.
 *
 * Indian number system: 1,00,000 instead of 100,000.
 */

const INDIAN_NUMBER_FORMATTER = new Intl.NumberFormat("en-IN");

/**
 * Format a number using the Indian numbering system.
 *
 * @param n - The number to format
 * @returns Formatted string like "1,00,000"
 *
 * @example
 * formatNumber(100000) // "1,00,000"
 * formatNumber(1234)   // "1,234"
 */
export function formatNumber(n: number): string {
  return INDIAN_NUMBER_FORMATTER.format(n);
}

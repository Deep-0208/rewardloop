/**
 * RewardLoop — Currency formatting.
 *
 * All monetary values in RewardLoop are stored as INTEGER paise.
 * This module converts paise to display-ready INR strings.
 */

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format paise (integer) to Indian Rupee display string.
 *
 * @param paise - Monetary value in paise (100 paise = ₹1)
 * @returns Formatted string like "₹1,200.50"
 *
 * @example
 * formatCurrency(120050) // "₹1,200.50"
 * formatCurrency(0)      // "₹0.00"
 * formatCurrency(-500)   // "-₹5.00"
 */
export function formatCurrency(paise: number): string {
  return INR_FORMATTER.format(paise / 100);
}

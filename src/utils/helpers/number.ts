/**
 * RewardLoop — Number helper utilities.
 */

/**
 * Clamp a number between a minimum and maximum value.
 *
 * @param value - The number to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The clamped value
 */
export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

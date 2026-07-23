/**
 * RewardLoop — Phone number formatting and normalization.
 *
 * Handles conversion between display format and E.164 storage format.
 * Indian mobile numbers: 10 digits starting with 6-9.
 */

/**
 * Format a phone number for display.
 *
 * @param phone - E.164 format "+91XXXXXXXXXX" or 10-digit "XXXXXXXXXX"
 * @returns Display format "+91 XXXXX XXXXX"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // Handle E.164 with country code
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }

  // Handle 10-digit local number
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  // Return as-is if format is unrecognized
  return phone;
}

/**
 * Normalize a phone number input to E.164 format.
 *
 * @param input - User input (10-digit Indian mobile number)
 * @returns E.164 format "+91XXXXXXXXXX" or null if invalid
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  // Already E.164 with country code
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    if (/^[6-9]\d{9}$/.test(local)) {
      return `+${digits}`;
    }
    return null;
  }

  // 10-digit Indian mobile
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }

  return null;
}

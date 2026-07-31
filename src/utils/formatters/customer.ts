/**
 * Utility functions for formatting customer information.
 */

/**
 * Formats a customer's display name consistently across the application.
 * If the customer has no name, it masks the phone number or displays it safely.
 *
 * @param name - The customer's full name (can be null/empty)
 * @param phone - The customer's phone number
 * @returns A formatted string safe for UI display
 */
export function formatCustomerDisplayName(
  name: string | null | undefined,
  phone: string | null | undefined,
): string {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  if (phone) {
    // Return phone directly or format it (e.g. +91 90238 33730)
    // Assuming E.164 format (+919023833730)
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    if (cleanPhone.length >= 12 && cleanPhone.startsWith("+91")) {
      return `+91 ${cleanPhone.slice(3, 8)} ${cleanPhone.slice(8)}`;
    }
    return phone;
  }

  return "Unknown Customer";
}

/**
 * RewardLoop — Phone Input Validation Schema.
 *
 * Validates 10-digit Indian mobile numbers starting with 6-9.
 *
 * @module features/auth/schemas/phone-schema
 */

import { z } from "zod";
import { REGEX, LIMITS } from "@/constants";

export const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(
      LIMITS.PHONE_LENGTH,
      `Phone number must be exactly ${LIMITS.PHONE_LENGTH} digits`,
    )
    .max(
      LIMITS.PHONE_LENGTH,
      `Phone number must be exactly ${LIMITS.PHONE_LENGTH} digits`,
    )
    .regex(REGEX.PHONE, "Enter a valid 10-digit Indian mobile number"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message:
      "You must accept the Terms of Service and Privacy Policy to continue.",
  }),
});

export type PhoneSchemaInput = z.infer<typeof phoneSchema>;

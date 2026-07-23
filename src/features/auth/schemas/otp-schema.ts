/**
 * RewardLoop — OTP Input Validation Schema.
 *
 * Validates 10-digit Indian mobile number and 6-digit numeric OTP code.
 *
 * @module features/auth/schemas/otp-schema
 */

import { z } from "zod";
import { REGEX, LIMITS } from "@/constants";

export const otpSchema = z.object({
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
  otp: z
    .string()
    .trim()
    .min(LIMITS.OTP_LENGTH, `OTP must be exactly ${LIMITS.OTP_LENGTH} digits`)
    .max(LIMITS.OTP_LENGTH, `OTP must be exactly ${LIMITS.OTP_LENGTH} digits`)
    .regex(REGEX.OTP, "OTP must contain numbers only"),
});

export type OTPSchemaInput = z.infer<typeof otpSchema>;

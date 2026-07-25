import { z } from "zod";

export const sendRewardOtpSchema = z.object({
  customerId: z.string().uuid(),
  rewardAmountPaise: z
    .number()
    .int()
    .min(100, "Reward redemption must be at least ₹1."),
});

export const verifyRewardOtpSchema = z.object({
  customerId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP."),
});

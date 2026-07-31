import { z } from "zod";

export const createBusinessSchema = z
  .object({
    name: z
      .string()
      .min(2, "Business name must be at least 2 characters.")
      .max(50, "Business name is too long."),
    business_type: z.enum([
      "salon",
      "spa",
      "gym",
      "cafe",
      "clinic",
      "car_wash",
      "other",
    ]),
    reward_percentage: z.number().int().min(1).max(50),
    max_redeem_percentage: z.number().int().min(1).max(100),
    services: z
      .array(
        z
          .object({
            name: z.string().min(1).max(100),
            price: z.number().int().min(100, "Minimum price is ₹1"),
          })
          .strict(),
      )
      .optional(),
    products: z
      .array(
        z
          .object({
            name: z.string().min(1).max(100),
            price: z.number().int().min(100, "Minimum price is ₹1"),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

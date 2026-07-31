import { z } from "zod";
import type { UUID } from "@/types";

export interface Customer {
  id: UUID;
  business_id: UUID;
  phone: string;
  name: string | null;
  total_visits: number;
}

export const searchCustomerSchema = z
  .object({
    phone: z
      .string()
      .regex(/^\+91\d{10}$/, "Phone number must be exactly 10 digits"),
  })
  .strict();

export const createCustomerSchema = z
  .object({
    phone: z
      .string()
      .regex(/^\+91\d{10}$/, "Phone number must be exactly 10 digits"),
    name: z.string().max(100, "Name is too long").optional(),
  })
  .strict();

export type SearchCustomerInput = z.infer<typeof searchCustomerSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

import { z } from "zod";
import type { UUID } from "@/types";

export interface Customer {
  id: UUID;
  business_id: UUID;
  phone: string;
  name: string | null;
  total_visits: number;
}

export const searchCustomerSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export const createCustomerSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  name: z.string().optional(),
});

export type SearchCustomerInput = z.infer<typeof searchCustomerSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

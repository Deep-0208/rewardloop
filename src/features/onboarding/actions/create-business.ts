"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export const createBusinessSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters."),
  business_type: z.enum([
    "salon",
    "spa",
    "gym",
    "cafe",
    "clinic",
    "car_wash",
    "other",
  ]),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

export type CreateBusinessResult = {
  success: boolean;
  message?: string;
  error?: string;
};

/**
 * Creates a new business and associates it with the currently authenticated user.
 */
export async function createBusiness(
  input: CreateBusinessInput,
): Promise<CreateBusinessResult> {
  try {
    // 1. Validate session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in again." };
    }

    // 2. Validate input
    const validatedFields = createBusinessSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid input provided.",
      };
    }

    const { name, business_type } = validatedFields.data;

    // 3. Use Admin client to bypass RLS for initial creation
    const adminSupabase = createAdminClient();

    // 4. Create Business
    const { data: newBusiness, error: businessError } = await adminSupabase
      .from("businesses")
      .insert({
        name,
        business_type,
        status: "active",
      })
      .select("id")
      .single();

    if (businessError || !newBusiness) {
      console.error("Failed to create business:", businessError);
      return {
        success: false,
        error: "Failed to create business. Please try again.",
      };
    }

    // 5. Link Business to User
    const { error: userError } = await adminSupabase
      .from("users")
      .update({
        business_id: newBusiness.id,
        role: "owner",
      })
      .eq("auth_user_id", user.id);

    if (userError) {
      console.error("Failed to link user to business:", userError);
      return {
        success: false,
        error: "Business created, but failed to link account. Contact support.",
      };
    }

    // 6. Provide default reward rules
    const { error: rulesError } = await adminSupabase
      .from("reward_rules")
      .insert({
        business_id: newBusiness.id,
        reward_percentage: 10,
        max_redeem_percentage: 100,
        min_redeem_amount: 0,
      });

    if (rulesError) {
      console.error("Failed to setup reward rules:", rulesError);
      // Non-fatal, they can set it up later
    }

    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Business created successfully!",
    };
  } catch (error) {
    console.error("createBusiness error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

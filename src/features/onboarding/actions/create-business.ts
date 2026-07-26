/* eslint-disable no-console */
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

import { createBusinessSchema, type CreateBusinessInput } from "../schemas";

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

    const {
      name,
      business_type,
      reward_percentage,
      max_redeem_percentage,
      services = [],
      products = [],
    } = validatedFields.data;

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
        reward_percentage: reward_percentage,
        max_redeem_percentage: max_redeem_percentage,
        min_redeem_amount: 0,
      });

    if (rulesError) {
      console.error("Failed to setup reward rules:", rulesError);
      // Non-fatal, they can set it up later
    }

    // 7. Create default catalog
    const { data: newCatalog, error: catalogError } = await adminSupabase
      .from("catalogs")
      .insert({
        business_id: newBusiness.id,
        name: "Default Catalog",
      })
      .select("id")
      .single();

    if (catalogError || !newCatalog) {
      console.error("Failed to create catalog:", catalogError);
    } else {
      // 8. Insert services and products
      const itemsToInsert = [
        ...services.map((s, i) => ({
          catalog_id: newCatalog.id,
          business_id: newBusiness.id,
          name: s.name,
          price: s.price,
          type: "service",
          status: "active",
          sort_order: i,
          created_by: user.id,
        })),
        ...products.map((p, i) => ({
          catalog_id: newCatalog.id,
          business_id: newBusiness.id,
          name: p.name,
          price: p.price,
          type: "product",
          status: "active",
          sort_order: services.length + i,
          created_by: user.id,
        })),
      ];

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await adminSupabase
          .from("catalog_items")
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("Failed to setup catalog items:", itemsError);
        }
      }
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

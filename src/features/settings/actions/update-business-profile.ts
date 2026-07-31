"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { businessProfileSchema } from "../schemas";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";
import type { BusinessProfileInput, UpdateBusinessProfileResponse } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("update-business-profile");

/** Update business profile. */
export async function updateBusinessProfile(
  input: BusinessProfileInput,
): Promise<UpdateBusinessProfileResponse> {
  try {
    const parseResult = businessProfileSchema.safeParse(input);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new AppError(
        issue?.message ?? "Invalid business profile.",
        "VALIDATION_FAILED",
      );
    }

    const { name } = parseResult.data;
    const cookieStore = await cookies();
    const supabase = await createClient();

    const validation = await validateRewardLoopSession(
      supabase,
      cookieStore.get(SESSION_VERSION_COOKIE.name)?.value,
    );
    if (!validation.valid) {
      throw new AppError("Authentication required.", "AUTH_REQUIRED");
    }

    const { data: userData } = await supabase
      .from("users")
      .select("business_id")
      .single();

    if (!userData?.business_id) {
      throw new AppError("Business not found.", "BUSINESS_NOT_FOUND");
    }

    const { data, error } = await supabase
      .from("businesses")
      .update({ name })
      .eq("id", userData.business_id)
      .select("id, name, business_type, email, gst_number, address")
      .single();

    if (error) {
      log.error("Failed to update business profile", {
        code: error.code,
        message: error.message,
      });
      throw new AppError("Failed to update business profile.", "SERVER_ERROR");
    }

    revalidatePath("/more");

    return actionSuccess({
      id: data.id,
      name: data.name,
      businessType: data.business_type,
      email: data.email,
      gstNumber: data.gst_number,
      address: data.address,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

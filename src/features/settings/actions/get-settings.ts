"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSettingsData } from "../services/settings-service";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";
import type { GetSettingsResponse } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";

/** Fetch settings page data. */
export async function getSettings(): Promise<GetSettingsResponse> {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();

    const validation = await validateRewardLoopSession(
      supabase,
      cookieStore.get(SESSION_VERSION_COOKIE.name)?.value,
    );
    if (!validation.valid) {
      throw new AppError("Authentication required.", "AUTH_REQUIRED");
    }

    const data = await getSettingsData(supabase);
    return actionSuccess(data);
  } catch (error) {
    return handleActionError(error);
  }
}

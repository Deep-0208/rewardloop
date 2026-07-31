"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCatalogManagement } from "../services/settings-service";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";
import type { GetCatalogManagementResponse } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError, AppError } from "@/lib/errors";

/** Fetch catalog items for management (including inactive). */
export async function getCatalogItems(): Promise<GetCatalogManagementResponse> {
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

    const items = await getCatalogManagement(supabase);
    return actionSuccess(items);
  } catch (error) {
    return handleActionError(error);
  }
}

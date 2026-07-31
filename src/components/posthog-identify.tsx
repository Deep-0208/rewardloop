"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

interface PostHogIdentifyProps {
  userId: string | null;
  phone: string | null;
  role: string | null;
}

export function PostHogIdentify({ userId, phone, role }: PostHogIdentifyProps) {
  useEffect(() => {
    if (userId) {
      posthog.identify(userId, {
        ...(phone ? { phone } : {}),
        ...(role ? { role } : {}),
      });
    }
  }, [userId, phone, role]);

  return null;
}

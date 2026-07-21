/**
 * RewardLoop — Application configuration constants.
 */

import type { AppConfig } from "@/types/common";

export const APP_CONFIG: AppConfig = {
  name: "RewardLoop",
  version: "0.1.1",
  description:
    "Digital loyalty system for local salons — billing first, loyalty second.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/** OTP configuration */
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 3,
  MAX_ATTEMPTS: 3,
} as const;

/** Transaction edit window */
export const TRANSACTION_CONFIG = {
  EDIT_WINDOW_MINUTES: 5,
} as const;

/** PWA install prompt threshold */
export const PWA_CONFIG = {
  INSTALL_PROMPT_AFTER_VISITS: 3,
} as const;

/** Touch target minimum (px) per design system */
export const TOUCH_TARGET_MIN = 48;

/** Animation durations (ms) per 09_UI_UX_Specification §15 */
export const ANIMATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
} as const;

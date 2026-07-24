/**
 * RewardLoop — Application limits and constraints.
 *
 * Sourced from 00_Founder_Decisions.md, 08_API_Design.md, and 00_Project_Setup.md.
 * No magic numbers — all limits referenced by name.
 */

export const LIMITS = {
  /** Phone number digits */
  PHONE_LENGTH: 10,

  /** OTP configuration */
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 3,
  OTP_MAX_ATTEMPTS: 3,

  /** Transaction edit window (minutes) */
  TRANSACTION_EDIT_WINDOW_MINUTES: 5,

  /** Pagination defaults */
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,

  /** PWA install prompt threshold */
  PWA_INSTALL_PROMPT_AFTER_VISITS: 3,

  /** Business name length */
  BUSINESS_NAME_MIN: 2,
  BUSINESS_NAME_MAX: 100,

  /** Catalog item name length */
  CATALOG_ITEM_NAME_MAX: 100,

  /** Touch target minimum (px) per design system */
  TOUCH_TARGET_MIN_PX: 48,

  /** Animation durations (ms) per 09_UI_UX_Specification §15 */
  ANIMATION_FAST_MS: 150,
  ANIMATION_NORMAL_MS: 200,
  ANIMATION_SLOW_MS: 300,
} as const;

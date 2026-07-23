/**
 * RewardLoop — LocalStorage and SessionStorage key constants.
 *
 * Single source of truth for all storage keys.
 * Never use raw strings for storage keys.
 */

export const STORAGE_KEYS = {
  /** PWA install prompt dismissed flag */
  PWA_PROMPT_DISMISSED: "rl:pwa-prompt-dismissed",

  /** Last active business ID (for quick restore) */
  LAST_BUSINESS_ID: "rl:last-business-id",

  /** Theme preference */
  THEME: "rl:theme",

  /** Onboarding completion flag */
  ONBOARDING_COMPLETE: "rl:onboarding-complete",
} as const;

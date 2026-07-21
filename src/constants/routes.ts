/**
 * RewardLoop — Route path constants.
 *
 * Single source of truth for all application routes.
 * Source: 07_Application_Architecture.md §4
 */

export const ROUTES = {
  /** Root — redirects to dashboard */
  HOME: "/",

  /* ─── Auth ──────────────────────────────────────────────────────────────── */
  LOGIN: "/login",
  VERIFY: "/verify",

  /* ─── Onboarding ────────────────────────────────────────────────────────── */
  ONBOARDING_BUSINESS: "/onboarding/business",
  ONBOARDING_REWARDS: "/onboarding/rewards",
  ONBOARDING_CATALOG: "/onboarding/catalog",

  /* ─── App (main) ────────────────────────────────────────────────────────── */
  DASHBOARD: "/dashboard",
  TRANSACTIONS: "/transactions",
  TRANSACTION_DETAIL: (id: string) => `/transactions/${id}` as const,
  INSIGHTS: "/insights",
  MORE: "/more",
  VISIT: "/visit",

  /* ─── Settings (nested under more) ──────────────────────────────────────── */
  SETTINGS_CATALOG: "/more/catalog",
  SETTINGS_REWARDS: "/more/rewards",
  SETTINGS_BUSINESS: "/more/business",
} as const;

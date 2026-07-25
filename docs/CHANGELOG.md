# Change Log

## 2026-07-24

- **Completed**
  - Established v1.0 Baseline Report (`00_Baseline_Report.md`).
  - Verified 39% completion status based on implemented UI and Authentication.
  - Extracted infrastructure tasks into Phase A.
  - Document officially frozen and Execution Rules established.
  - Created `01_Execution_Tracker.md` to track feature-level implementation progress across 5 Phases and 3 Milestones.

## 2026-07-24 (Phase A Execution)

- **Completed**
  - Migrations verified.
  - RLS verified and missing catalog_items policy created.
  - Environment validated and .env.example updated with MSG91 variables.
  - Dependencies verified and shadcn moved to devDependencies.
  - Build verified (Next.js 16.2.10 compiled successfully).
  - Architectural deprecation warning fixed by renaming middleware.ts to proxy.ts.

### Phase B: Milestone 1 - Customer Selection

- Created Customer type definitions (Zod schema for search and create).
- Implemented customer service layer for DB operations (search, create).
- Implemented server actions (searchCustomer, createCustomer).
- Built CustomerSelectionStep UI component matching PRD specifications.
- Integrated customer selection into /visit wizard flow.
- Verified TypeScript, ESLint, and Next.js Build pass successfully.

## 2026-07-24 (Audit Remediation Sprint)

- **Remediated Security & Database Vulnerabilities**:
  - Fixed SQL migration syntax error in `20260724110000_catalog_items_rls.sql`.
  - Hardened Row-Level Security (RLS) on `catalog_items` table with strict `business_id` tenant isolation.
  - Secured customer lookup & creation services (`findCustomerByPhone`, `searchCustomer`, `createCustomer`) with mandatory `business_id` scoping.
  - Restricted `check_and_update_otp_cooldown` RPC execution permissions strictly to `service_role`.
  - Created missing application route pages (`/transactions`, `/insights`, `/more`).
  - Wired global `BottomNavigation` shell into `(app)/layout.tsx`.
  - Standardized Next.js middleware in `src/middleware.ts` and configured explicit auth bypass flags.
  - Configured Vitest test runner dependency and added `"test": "vitest run"` script to `package.json`.
  - Handled Edge Function transaction SMS errors cleanly with structured diagnostic logging.
  - Cleaned up scratch build files and verified `npm run typecheck` and `npm run lint`.

## 2026-07-24 (UI Polish Sprint)

- **Polished Login & Verify Screens**:
  - Removed Card wrapper for mobile-first feel, added brand icon header with app name and tagline.
  - Adopted reference project's centered layout, spacing, and full-width 56px CTA button pattern.
  - Added `animate-in` entry animations for brand header and form sections.
- **Improved Navigation & Safety**:
  - BottomNavigation auto-hides during active wizard steps (Catalog → Reward → Summary).
  - Added Unsaved Visit confirmation dialog when navigating away with cart data.
  - Touch targets on quantity stepper buttons increased to 44px (`size-11 touch-target`).
- **Upgraded Design System**:
  - Added motion system (shake, scaleIn, slideDown, slideUp, shimmer animations).
  - Added surface utility classes (`surface-card`, `surface-elevated`).
  - StickyCTA and CartSummaryFooter upgraded with stronger backdrop-blur-xl, bottom shadows, and safe-area-inset-bottom padding.
- **Improved Reward Calculation UX**:
  - Added percentage chip buttons (25%, 50%, 75%, 100%) calculating against `maxRedeemPaise`.
- **Polished Empty States**:
  - Dashboard, Transactions, Insights, and More pages now show actionable guidance with primary CTAs.
- **Validation**: 0 TypeScript errors, 0 ESLint errors.

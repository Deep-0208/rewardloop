# Changelog

All notable changes to the RewardLoop project will be documented in this file.

## [Unreleased]

### Added

- **Global Design System Tokens:** Added comprehensive Tailwind tokens for radiuses (`radius-input`, `radius-card`, `radius-sheet`) and shadows (`shadow-card`, `shadow-soft`, `shadow-float`, `shadow-hero`) in `globals.css` to enable a premium, layered aesthetic.
- **Motion Utilities:** Implemented custom CSS micro-animations (`animate-fade-in`, `animate-scale-in`, `animate-shake`, `animate-fab-glow`) and shimmering loading skeletons for polished interaction physics.

### Changed

- **UI Redesign Overhaul:** Fully migrated the app from flat borders to a shadow-elevated design. Upgraded `Card`, `Button`, `Input`, and all Wizard Flow cards to use the new premium radius and shadow tokens.
- **Navigation:** Replaced the standard bottom bar with a floating glassmorphic nav featuring a prominent glowing center FAB (Floating Action Button).
- **Mobile Touch Targets:** Scaled up all form fields, OTP inputs, and interactive buttons to a minimum 48px height with `active:scale-[0.98]` tactile feedback.

### Fixed

- **Infinite Rendering Loop:** Fixed a critical bug in `CustomerSelectionStep` where an immediate state reset after a 10-digit auto-search caused a continuous loop of network requests.

- **Complete Visit Transaction:** Added the atomic `complete_visit` database RPC, idempotency protection, server-side price/reward recalculation, immutable transaction-item snapshots, reward-ledger writes, wallet/customer updates, and complete rollback on failure.
- **Reward Redemption OTP:** Added bcrypt-hashed, six-digit reward OTP send, verification, expiry, three-attempt lockout, 30-second resend cooldown, five-per-15-minute rate limit, and single-use consumption at visit commit.
- **Checkout Completion UI:** Added payment method selection, responsive OTP confirmation, inline failures and retry states, duplicate-submit protection, and the one-second “Visit Completed” dashboard hand-off.
- **Checkout Summary:** Added an authoritative itemized checkout review with separate service/product subtotals, reward and wallet previews, pre-flight validation actions, responsive summary states, and a Complete Visit hand-off.
- **Reward Calculation:** Added the shared paise-only billing engine, server-authoritative reward calculation actions, fresh wallet/rule/catalog validation, and the responsive Step 3 reward screen with manual redemption, automatic clamping, live summaries, and inline loading, empty, and error states.
- **Hybrid OTP Rate Limiting:** Implemented a new `otp_requests` database table and `check_and_update_otp_cooldown` RPC to enforce a strict 30-second cooldown on all SMS OTP requests to prevent abuse and API exhaustion.
- **Edge Cache Cooldown:** Added the `rl_otp_lock` signed HTTP-only cookie to provide a zero-latency fast-path for checking rate limits at the edge before querying the database.
- **Atomic Session Revocation:** Added the `increment_session_version` RPC to safely increment the `session_version` integer on `users` within a single database transaction, fully neutralizing race conditions.
- **Session Validator Layer:** Created `session-validator.ts` to act as the single source of truth for session integrity, shared between Next.js Edge Middleware and Server Actions.
- **Cryptographic Cookie Signatures:** Added a strict 32-character requirement for `REWARDLOOP_SESSION_SECRET` which signs the `rl_sv` cookie to prevent tampering.

### Changed

- **Authentication Flow Atomicity:** The `verifyOTP` Server Action now wraps all database mutations in a strict `try/catch`. If any post-verification step (like session version increment) fails, the application forcefully triggers a Supabase `signOut()` and deletes local cookies, cleanly rolling back to a secure unauthenticated state.
- **Edge Middleware:** Upgraded middleware to explicitly validate the signed `rl_sv` cookie alongside the Supabase session, immediately intercepting and redirecting users whose `session_version` was revoked by another device.
- **Logout Behavior:** The `logout` Server Action now atomically increments the user's `session_version` before triggering the Supabase sign-out, cryptographically guaranteeing all older cookies are instantly invalidated.
- **UI Components:** Enhanced `OTPInput` with `React.forwardRef` to allow proper focus restoration during validation failures.

### Security

- **Fail-Fast Environment Validation:** Startup now crashes intentionally if `REWARDLOOP_SESSION_SECRET` is missing or below 32 characters, removing all unsafe fallback keys from production.
- **Isolated Device Sessions:** Enforced strict one-device-per-user policies at the Edge level.

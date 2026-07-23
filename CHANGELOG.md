# Changelog

All notable changes to the RewardLoop project will be documented in this file.

## [Unreleased]

### Added

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

# Admin Client Audit (`createAdminClient`)

The `createAdminClient` function bypasses Postgres Row-Level Security (RLS) by leveraging the `service_role` key. To prevent privilege creep, every usage of this function must be documented in this table.

| File | Function / Action | Reason for Privilege Elevation | Safe? (Justification) |
| --- | --- | --- | --- |
| `src/features/reward/services/reward-otp-service.ts` | `sendRewardOtp` | Inserts a new OTP request. The `otp_requests` table cannot be inserted into by the client directly because RLS prevents non-owners from writing, but OTPs must be sent without the customer needing an account. | **Yes.** Bound by strict phone number validation and backend rate limits. Does not expose existing data. |
| `src/features/reward/services/reward-otp-service.ts` | `retryRewardOtp` | Updates an existing OTP request to increment the retry counter. | **Yes.** Validates `otp_request_id`, limits retries to maximum threshold, and only affects the specific OTP session. |
| `src/features/reward/services/reward-otp-service.ts` | `verifyRewardOtp` | Reads and deletes the OTP request upon successful verification to prevent replay attacks. | **Yes.** Only returns success/failure boolean and strictly validates the 6-digit pin against the hashed token in the DB. |
| `src/features/auth/utils/otp-cooldown.ts` | `isOtpRateLimited` | Calls the `check_and_update_otp_cooldown` RPC. RLS might block unauthenticated users from reading rate limit rows. | **Yes.** The RPC itself is `SECURITY DEFINER` and manages its own internal state safely. |
| `src/features/auth/actions/verify-otp.ts` | `verifyOTP` | Calls `adminSupabase.auth.verifyOtp` to verify the user's login OTP. | **Yes.** Next.js Server Actions require this to exchange the OTP for a session on the server side securely. |
| `src/features/auth/actions/logout.ts` | `logout` | Calls `adminSupabase.auth.admin.signOut` to forcibly sign the user out across all devices. | **Yes.** Requires the user's session token to identify them, ensuring they can only sign themselves out. |

> **Rule:** Any new pull request adding `createAdminClient` MUST append a row to this table, or it will be rejected.

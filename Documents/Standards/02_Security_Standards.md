# Security Standards

## Authentication & Authorization

- **Authentication:** Passwordless OTP via Supabase Auth.
- **Session Integrity:** Single source of truth (`session-validator.ts`) enforces single-device isolated sessions natively at the Edge. The signed `rl_sv` cookie tracks `session_version` and securely signs out stale devices.
- **Authorization & RBAC:** Enforced at the Row Level Security (RLS) layer in Supabase and via middleware.
- **Supabase RLS:** EVERY public table must have RLS enabled. Write explicit policies for SELECT, INSERT, UPDATE, DELETE tied to `auth.uid()`.
- **JWT & Cookies:** Use secure, HttpOnly, SameSite cookies to store session tokens. The `REWARDLOOP_SESSION_SECRET` cryptographically signs the `rl_sv` cookie. Do not store JWTs in localStorage.

## Threat Mitigation

- **SQL Injection:** Handled natively by Supabase (PostgREST). Never concatenate SQL strings directly.
- **XSS (Cross-Site Scripting):** Rely on React's automatic DOM escaping. Sanitize any raw HTML inputs using DOMPurify.
- **CSRF (Cross-Site Request Forgery):** Next.js Server Actions automatically implement anti-CSRF tokens.
- **Rate Limiting & Cooldowns:** Implement hybrid rate limiting. Database RPC (`check_and_update_otp_cooldown`) acts as the authoritative source of truth, while signed `rl_otp_lock` cookies act as an Edge-level cache optimization.
- **Authentication Rollback:** Ensure complete atomicity of authentication logic via `try/catch`. Immediately revoke and sever sessions if mid-flight validations fail.
- **Secrets Management:** Store all secrets in `.env.local` or a secure vault (Vercel Env Vars). Never commit `.env`. Prefix public variables strictly with `NEXT_PUBLIC_`. Minimum 32-character secrets required for cryptographic signing.

## Data & Auditing

- **Input Validation:** Use Zod on both client and server boundaries.
- **Output Encoding:** Ensure APIs don't leak sensitive data (e.g., password hashes, internal IDs).
- **File Upload Security:** Validate MIME types and file sizes before uploading to Supabase Storage. Set specific bucket policies.
- **Audit Logs:** Log critical mutations (billing, auth) to a separate `audit_logs` table.
- **Monitoring & Dependency Security:** Run `npm audit` in CI. Use Snyk or Dependabot.
- **Security Headers:** Enforce strict CSP, HSTS, X-Frame-Options in `next.config.js`.

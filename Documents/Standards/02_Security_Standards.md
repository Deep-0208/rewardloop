# Security Standards

## Authentication & Authorization

- **Authentication:** Passwordless OTP via Supabase Auth.
- **Authorization & RBAC:** Enforced at the Row Level Security (RLS) layer in Supabase and via middleware.
- **Supabase RLS:** EVERY public table must have RLS enabled. Write explicit policies for SELECT, INSERT, UPDATE, DELETE tied to `auth.uid()`.
- **JWT:** Use secure, HttpOnly, SameSite cookies to store session tokens. Do not store JWTs in localStorage.

## Threat Mitigation

- **SQL Injection:** Handled natively by Supabase (PostgREST). Never concatenate SQL strings directly.
- **XSS (Cross-Site Scripting):** Rely on React's automatic DOM escaping. Sanitize any raw HTML inputs using DOMPurify.
- **CSRF (Cross-Site Request Forgery):** Next.js Server Actions automatically implement anti-CSRF tokens.
- **Rate Limiting:** Implement Upstash/Redis rate limiting on authentication and mutation endpoints (e.g., 5 req/min for OTP).
- **Secrets Management:** Store all secrets in `.env.local` or a secure vault (Vercel Env Vars). Never commit `.env`. Prefix public variables strictly with `NEXT_PUBLIC_`.

## Data & Auditing

- **Input Validation:** Use Zod on both client and server boundaries.
- **Output Encoding:** Ensure APIs don't leak sensitive data (e.g., password hashes, internal IDs).
- **File Upload Security:** Validate MIME types and file sizes before uploading to Supabase Storage. Set specific bucket policies.
- **Audit Logs:** Log critical mutations (billing, auth) to a separate `audit_logs` table.
- **Monitoring & Dependency Security:** Run `npm audit` in CI. Use Snyk or Dependabot.
- **Security Headers:** Enforce strict CSP, HSTS, X-Frame-Options in `next.config.js`.

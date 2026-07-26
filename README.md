# RewardLoop

Digital loyalty system for local salons — billing first, loyalty second.

## Deployment Checklist

Before deploying to staging or production, ensure the following steps are completed:

- [ ] **Database Migrations:** Apply all Supabase migrations (e.g. `npx supabase db push`).
- [ ] **Environment Variables:** Verify all required environment variables are set in your hosting provider (Vercel):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (Required for OTP generation and admin actions)
  - `SESSION_COOKIE_SECRET` (Must be a secure random string of at least 32 characters)
  - `MSG91_AUTH_KEY` (For OTP delivery)
  - `MSG91_OTP_TEMPLATE_ID`
- [ ] **PWA Configuration:** Ensure `public/icons/icon-192.png` and `public/icons/icon-512.png` exist for PWA installation support.
- [ ] **Test Suite:** Ensure all Vitest tests pass by running `npm run test`.
- [ ] **Build:** Ensure the Next.js app builds successfully without type errors (`npm run build`).

# 09_Testing_Release.md

> **Project:** RewardLoop
>
> **Sprint:** 9
>
> **Feature:** Testing & Release
>
> **Version:** 1.0
>
> **Status:** Ready for Development
>
> **Purpose:** Define how RewardLoop is tested, validated, deployed, and released. No feature may reach production without satisfying this document. This becomes the Engineering Quality Source of Truth.
>
> **Depends on:** 00_Founder_Decisions.md, 03_Product_PRD.md, 04_Domain_Model.md, 05_System_Architecture.md, 06_Database_Design.md, 07_Application_Architecture.md, 08_API_Design.md, 09_UI_UX_Specification.md, Development/00_Project_Setup.md, Development/01_Authentication.md, Development/02_Onboarding.md, Development/03_Dashboard.md, Development/04.1_Customer_Selection.md, Development/04.2_Billing_Engine.md, Development/04.3_Catalog_Selection.md, Development/04.4_Reward_Redemption.md, Development/04.5_Complete_Visit.md, Development/05_Transactions.md, Development/06_Insights.md, Development/07_More_Settings.md, Development/08_PWA_Offline.md

---

# Table of Contents

1. Sprint Goal
2. Scope
3. Testing Philosophy
4. Testing Pyramid
5. Unit Testing
6. Integration Testing
7. End-to-End Testing
8. Manual QA
9. Accessibility Testing
10. Responsive Testing
11. Performance Testing
12. Security Testing
13. Database Validation
14. API Validation
15. Billing Validation
16. Reward Validation
17. PWA Testing
18. Browser Compatibility
19. Device Compatibility
20. Regression Testing
21. Smoke Testing
22. UAT
23. Acceptance Criteria
24. CI/CD Pipeline
25. Release Workflow
26. Rollback Strategy
27. Monitoring
28. Logging
29. Backup & Recovery
30. Production Checklist
31. MVP Sign-off
32. Engineering Quality Gates
33. Incident Response
34. Technical Debt Policy
35. Documentation Maintenance
36. Release Invariants
37. Version History

---

# 1. Sprint Goal

Every release must be:

- **Correct:** All business and financial logic is mathematically infallible.
- **Reliable:** Zero downtime, graceful degradation offline.
- **Secure:** Row-Level Security protects all business isolation.
- **Accessible:** Usable by all users and compliant.
- **Performant:** Responds under strict latency targets.
- **Recoverable:** Automated backups and fast rollback capabilities.
- **Deployable:** Predictable and repeatable CI/CD pipelines.

---

# 2. Scope

## Included

- Automated Testing (Unit, Integration, E2E)
- QA processes (Manual, UAT)
- CI/CD Deployment configurations
- Production monitoring and alerts
- Database migration & rollback policies
- Production Readiness Checklist

## Not Included

- Business Logic Changes (Sprints 1-8 are locked)
- Feature Development (No new features here)
- UI Redesign

---

# 3. Testing Philosophy

**Engineering Principles:**

- **Test early:** Validation runs locally on pre-commit hooks.
- **Test automatically:** CI blocks failing code.
- **Test manually:** Nothing goes to prod without human UAT.
- **Never skip regression:** A fix in one area must not break another.
- **Financial features require highest confidence:** The Billing Engine must have 100% test coverage.
- **Server is source of truth:** The client is untrusted; tests must validate API boundaries.
- **Bug fixes require regression:** Every bug fix must include a test proving the bug existed and is now solved.
- **Production stability before feature velocity:** We do not ship broken code to meet arbitrary deadlines.

---

# 4. Testing Pyramid

- **Unit Tests:** High volume, extreme speed. Testing pure functions, Zod schemas, and hooks. Expected coverage: 90%+.
- **Integration Tests:** Medium volume, medium speed. Testing React Server Actions interacting with Supabase.
- **End-to-End (E2E) Tests:** Low volume, slower speed. Testing critical user paths in a headless browser (Playwright/Cypress).
- **Manual QA:** Human verification of UX, animations, and edge-case behaviors.

---

# 5. Unit Testing

**Focus Areas:**

- **Pure Functions:** Specifically the Billing Engine math (`calculateSubtotal`, `calculateReward`).
- **Validation:** Zod schemas.
- **Utilities:** Date formatters, currency formatters.
- **Hooks & Stores:** Zustand state initialization and transitions.

**Target Coverage:** Minimum 90%. Billing Engine must be 100%.

---

# 6. Integration Testing

Verifies the boundaries between components:

- **Authentication:** Token verification and route protection.
- **Billing:** Server Action correctly calling Billing Engine pure functions.
- **Reward:** OTP generation and validation flow.
- **Transactions:** Ensuring Complete Visit writes to all 4 tables atomically.
- **Insights:** Verifying SQL aggregations match expected data sets.
- **Settings:** Verifying that Settings correctly invalidates caches.
- **PWA:** SW registration.

---

# 7. End-to-End Testing

Complete user journeys must be automated via Playwright/Cypress.

**The Golden Path:**

```text
Authentication
↓
Onboarding
↓
Dashboard
↓
Customer Selection
↓
Catalog Selection
↓
Billing Engine Calculation
↓
Reward Redemption (OTP mock)
↓
Complete Visit (Transaction Commit)
↓
Transactions (Verification)
↓
Insights (Verification)
```

_Every step of this journey must pass automatically before deployment._

---

# 8. Manual QA

Checklist before Release Candidate approval:

- **UI:** Visual alignment, paddings, fonts.
- **Forms:** Keyboard behavior, submit states.
- **Navigation:** Back button behavior, deep linking.
- **OTP:** Real SMS delivery and typing experience.
- **Billing:** Manual edge-case math checks.
- **Transactions:** Receipt rendering.
- **Settings:** Form resets and cache purging.
- **Offline:** Disconnecting internet and verifying banners.
- **Responsive:** Layout holds up on small phones.
- **Accessibility:** Screen readers and contrast.

---

# 9. Accessibility Testing

- **Keyboard:** Full Tab navigation support.
- **Screen Reader:** VoiceOver/TalkBack testing.
- **Contrast:** WCAG AA compliance (4.5:1 ratio).
- **Touch Targets:** Minimum 44x44px.
- **Focus:** Visible focus rings on active elements.
- **ARIA:** Correct roles for dialogs, bottom sheets, and alerts.
- **Reduced Motion:** Respect `prefers-reduced-motion` OS flags.

---

# 10. Responsive Testing

Mandatory breakpoints to verify:

- 320px (Small Android / iPhone SE)
- 360px (Standard Android)
- 390px (iPhone 13/14/15)
- 412px (Large Android)
- 768px (iPad Mini Portrait)
- 1024px (iPad Landscape)
- Must test both **Portrait** and **Landscape** orientations.

---

# 11. Performance Testing

**Targets:**

- **App Launch:** < 2 seconds (First Contentful Paint).
- **PWA Install:** Instantly available.
- **Cache:** Offline cache retrieval < 50ms.
- **Dashboard Load:** < 500ms.
- **Billing Engine:** < 10ms per calculation.
- **API (Complete Visit):** < 500ms server response.
- **Database:** Query execution < 100ms.
- **Insights:** Aggregations < 500ms.

---

# 12. Security Testing

- **Authentication:** Session hijacking protection, cookie security.
- **OTP:** Brute-force rate limiting (max 3 attempts).
- **Authorization:** RLS strictly isolating tenant data.
- **SQL Injection:** Parameterized queries strictly via Supabase.
- **XSS:** React auto-escaping, sanitization of inputs.
- **CSRF:** Next.js Server Action protections.
- **Secrets:** Environment variables properly segregated.
- **Rate Limits:** API throttling.
- **Replay Attacks:** OTP freshness windows (5 minutes).
- **Session Expiry:** Forced logouts after inactivity/token expiration.

---

# 13. Database Validation

Before deployment to production:

- **Foreign Keys:** Verified intact.
- **Indexes:** Applied for search speed (Phone, Name).
- **Constraints:** Non-nulls, unique phone numbers verified.
- **Transactions:** ACID compliance on `Complete Visit` verified.
- **Rollback:** Migration down-scripts tested.
- **Seed:** Staging environment seeded cleanly.
- **Backup:** PG_DUMP backup verified before migrations run.

---

# 14. API Validation

Every Server Action must validate:

- **Input:** Zod schema parses correctly.
- **Validation:** Business rules (e.g., cannot redeem more than wallet).
- **Output:** Consistent DTO structures.
- **Errors:** Handled cleanly (no raw SQL errors sent to client).
- **Authorization:** `getUser()` verified on every call.
- **Performance:** Under 500ms SLA.

---

# 15. Billing Validation

**Critical path testing.**
Verify:

- Billing formulas match documentation exactly.
- Wallet balances are perfectly maintained.
- Reward rules apply cleanly.
- Ledger entries map 1:1 with Transactions.
- Server validation independently rejects bad client data.
- **Rule:** Never trust the client. Server recalcs everything.

---

# 16. Reward Validation

Verify:

- OTP generation matches the right phone number.
- Wallet cannot drop below 0.
- Redeem values cannot exceed Max Redeem %.
- Ledger history equals Wallet current balance exactly.

---

# 17. PWA Testing

Verify:

- Manifest is valid.
- Install prompt triggers on Chrome/Android.
- Offline banner works.
- Cache serves files when network is dead.
- Service Worker activates correctly.
- Update dialog works.
- Background Sync queues correctly.
- Browser install works smoothly on iOS Safari via Share menu.

---

# 18. Browser Compatibility

Supported versions (Latest 2 major versions):

- **Chrome** (Desktop/Android)
- **Edge** (Desktop)
- **Safari** (Desktop/iOS)
- **Firefox** (Desktop/Android)

---

# 19. Device Compatibility

- **Android:** Samsung, Pixel, Budget phones.
- **iPhone:** Current and -3 generations (down to iPhone 11).
- **Tablet:** iPad, Galaxy Tab.
- **Desktop:** For Insights and Settings management.
- **Low-end devices:** Test for memory leaks in React.
- **High DPI:** Verify vector (SVG) rendering.

---

# 20. Regression Testing

Critical paths that must never break:

- Authentication
- Billing Calculation
- Reward OTP
- Complete Visit (Database commit)
- Transactions rendering
- Settings update
- PWA caching

---

# 21. Smoke Testing

Post-deployment quick check:

1. Build deployed.
2. Login to production as test user.
3. Dashboard loads.
4. Complete a test visit.
5. Transaction appears in history.
6. Logout.

---

# 22. User Acceptance Testing (UAT)

To be conducted by non-developers:

- **Owner:** Verifies Insights, Settings, and overall feel.
- **Receptionist / Salon Staff:** Verifies speed of the Billing flow.
- **Real Device:** Must be tested on physical hardware, not just emulators.
- **Real Internet:** Tested on 3G, 4G, and Wi-Fi.
- **Sign-off:** Written approval required before launch.

---

# 23. Acceptance Criteria

_Minimum of 100 measurable requirements across the suite._

**Examples:**

- [ ] Build succeeds with zero warnings.
- [ ] TypeScript compilation `tsc --noEmit` passes.
- [ ] ESLint passes with zero warnings.
- [ ] UI is perfectly responsive down to 320px.
- [ ] Billing calculation matches Excel financial models.
- [ ] Wallet updates are mathematically flawless.
- [ ] OTP fails after 3 bad attempts.
- [ ] Transactions load under 500ms.
- [ ] Insights correctly sums daily revenue.
- [ ] Offline banner appears in < 1s of network drop.
- [ ] All inputs are keyboard accessible.
- [ ] Row Level Security blocks cross-tenant reads.
      _(And 88 more derived from Sprints 1-8)._

---

# 24. CI/CD Pipeline

The GitHub Actions / Vercel workflow:

```text
Lint (ESLint/Prettier)
↓
Type Check (TypeScript)
↓
Unit Tests (Jest/Vitest)
↓
Integration Tests
↓
Build (Next.js Build)
↓
Deploy Preview (Vercel Branch URL)
↓
QA Approval (Manual Sign-off)
↓
Production (Merge to Main)
```

---

# 25. Release Workflow

1. **Feature Complete:** Dev finishes ticket.
2. **QA:** Local manual testing.
3. **Regression:** Automated suite runs.
4. **Release Candidate:** Deployed to staging.
5. **Approval:** Founder/UAT sign-off.
6. **Production:** Merged to main, deployed.
7. **Monitoring:** 1-hour hyper-care window post-deploy.
8. **Close Sprint:** Ticket marked done.

---

# 26. Rollback Strategy

In the event of a critical P0 failure:

```text
Failed Deploy Detected (Alert fires)
↓
Rollback (Vercel 1-click revert to previous sha)
↓
Health Check (Verify rollback restored service)
↓
Root Cause Analysis (Debug offline)
↓
Fix (Create patch)
↓
Redeploy (Run pipeline again)
```

_Rule: Never debug live on production. Rollback first, debug second._

---

# 27. Monitoring

- **Application:** Sentry (React boundaries).
- **API:** Vercel Analytics / Sentry.
- **Database:** Supabase Dashboard (Slow queries, connections).
- **Performance:** Web Vitals tracking.
- **Errors:** Slack alerts for 500s.
- **Availability:** UptimeRobot.
- **PWA:** Tracking failed Service Worker installations.

---

# 28. Logging

- **Server Logs:** Retained 30 days.
- **Audit Logs:** Configuration changes logged in DB.
- **Authentication:** Login/Logout events tracked.
- **Billing:** Anomalous wallet changes trigger alerts.
- **Errors:** Stack traces scrubbed of PII.
- **Security:** Brute-force attempts logged.

---

# 29. Backup & Recovery

- **Database Backup:** Supabase automated daily backups. Point-in-time recovery (PITR) enabled.
- **Restore:** Documented process in playbook.
- **Disaster Recovery:** Ability to stand up fresh Supabase instance if region fails.
- **RTO (Recovery Time Objective):** < 1 hour.
- **RPO (Recovery Point Objective):** < 15 minutes of lost data.

---

# 30. Production Checklist

- [ ] **Infrastructure:** Vercel Production environment active.
- [ ] **Database:** Supabase Production project provisioned.
- [ ] **Environment:** Prod `.env` vars set.
- [ ] **Secrets:** API keys rotated from staging.
- [ ] **Domain:** Custom domain attached and verified.
- [ ] **HTTPS:** SSL certificates generated and enforced.
- [ ] **Monitoring:** Sentry linked to Production.
- [ ] **Analytics:** Plausible/GA active.
- [ ] **PWA:** `manifest.json` pointing to prod URLs.
- [ ] **Testing:** E2E suite passes against staging.
- [ ] **Security:** RLS verified active on all tables.
- [ ] **Performance:** Lighthouse score > 90.
- [ ] **Accessibility:** Axe tool reports 0 violations.
- [ ] **Legal:** Terms and Privacy Policy linked and valid.

---

# 31. MVP Sign-off

The final step before public release.

- **Founder:** Final visual and strategic approval.
- **Engineering:** Tech lead approves code quality.
- **QA:** QA lead approves testing matrix.
- **Product:** Feature completeness verified.
- **Go/No-Go:** Formal documented decision.

---

# 32. Engineering Quality Gates

**Rules for merging to `main`:**

- Build passes perfectly.
- TypeScript has 0 errors.
- ESLint has 0 errors.
- Unit/E2E tests 100% pass.
- Accessibility passes automated checks.
- Performance budget passes (bundles not bloated).
- Security checks (Dependabot/Snyk) pass.
- No `console.log` or `console.error` in production code.
- No `// TODO` or `// FIXME` left unresolved.
- No bypassing Server Actions API validations.

---

# 33. Incident Response

**Severity Levels:**

- **P0 (Critical):** App is down. Database corrupted. Billing broken. Fix immediately. Drop everything.
- **P1 (High):** Major feature broken but app usable. Fix within 4 hours.
- **P2 (Medium):** Minor bug, no data loss. Fix next sprint.
- **P3 (Low):** UI glitch, typo. Fix when convenient.

**Flow:** Escalation → Communication → Hotfix (via Rollback) → Postmortem → Recovery.

---

# 34. Technical Debt Policy

- **Definition:** Intentional shortcuts taken for MVP speed.
- **Classification:** Documented with `TECH DEBT` tickets.
- **Tracking:** Maintained in backlog.
- **Prioritization:** Reviewed every sprint planning.
- **Resolution:** 20% of engineering time allocated to cleanup post-MVP.
- **Review:** Architecture reviews monthly.

---

# 35. Documentation Maintenance

Documentation (this entire repository) must be updated:

- When business rules change (e.g., Reward %).
- When APIs change (request/response shapes).
- When UI changes (new screens).
- When database schemas change (new tables).
- When architecture changes (moving to a new framework).

_Code does not ship unless the documentation matches._

---

# 36. Release Invariants

There will be NO release without:

- Passing CI pipelines.
- Passing Manual QA.
- Passing Regression testing.
- Founder approval.
- Engineering approval.
- Proper SemVer version update.
- Database migration validation.
- Database backup verification.
- Rollback plan verification.

---

# 37. Version History (Superseded)

_(See Section 43 for current version history)_

---

# 38. Test Coverage Matrix

| Module             | Unit | Integration | E2E | Manual |
| ------------------ | ---- | ----------- | --- | ------ |
| Authentication     | ✓    | ✓           | ✓   | ✓      |
| Onboarding         | ✓    | ✓           | ✓   | ✓      |
| Dashboard          | ✓    | ✓           | ✓   | ✓      |
| Customer Selection | ✓    | ✓           | ✓   | ✓      |
| Billing Engine     | 100% | ✓           | ✓   | ✓      |
| Catalog            | ✓    | ✓           | ✓   | ✓      |
| Reward Redemption  | ✓    | ✓           | ✓   | ✓      |
| Complete Visit     | ✓    | ✓           | ✓   | ✓      |
| Transactions       | ✓    | ✓           | ✓   | ✓      |
| Insights           | ✓    | ✓           | ✓   | ✓      |
| Settings           | ✓    | ✓           | ✓   | ✓      |
| PWA                | ✓    | ✓           | ✓   | ✓      |

---

# 39. Environment Matrix

Development
↓
Local Testing
↓
Preview
↓
Staging
↓
Production

**Environment Details:**

- **Development:** Localhost. Sandbox DB. No secrets. Open access.
- **Local Testing:** Local build. Staging DB branch. Dev secrets. Open access.
- **Preview:** Vercel Branch URL. Staging DB. Staging secrets. Password protected.
- **Staging:** Vercel `staging` branch. Staging DB. Staging secrets. Founder/QA only.
- **Production:** Live Domain. Production DB. Production secrets. Active monitoring. Salon staff only.

---

# 40. Project Definition of Done

A feature is complete only when:

- [x] Code complete
- [x] Documentation updated
- [x] Unit tests pass
- [x] Integration tests pass
- [x] E2E tests pass
- [x] Manual QA passes
- [x] Accessibility passes
- [x] Performance budget passes
- [x] Security review completed
- [x] Founder approval obtained
- [x] Production ready

---

# 41. Release Timeline

Feature Freeze
↓
QA Freeze
↓
Regression
↓
Release Candidate
↓
Founder Sign-off
↓
Production
↓
Monitoring
↓
Retrospective

---

# 42. Repository Status

Planning Documents
🔒 **LOCKED**

Development Documents
🔒 **LOCKED**

Future modifications require:

- Founder Decision change
- Architecture review
- Documentation update
- Engineering approval
- Version update

---

# 43. Version History

| Version | Status  | Changes                                                                                  |
| ------- | ------- | ---------------------------------------------------------------------------------------- |
| 1.0     | Initial | Testing & Release Playbook                                                               |
| 1.1     | Current | Added test coverage, environment matrix, DoD, release timeline, locked entire repository |

---

# Document Status

🔒 **LOCKED**

**Testing & Release Source of Truth**

This concludes the engineering blueprints for the RewardLoop MVP.

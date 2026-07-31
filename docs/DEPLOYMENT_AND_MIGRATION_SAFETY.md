# RewardLoop — Production Deployment, Migration Safety & Disaster Recovery Guide

## 1. Overview

This document specifies the operational standards for deploying RewardLoop, executing zero-downtime database schema migrations, enforcing environment isolation, and managing Disaster Recovery (DR) protocols.

---

## 2. Zero-Downtime Database Migration Strategy (Expand / Contract Pattern)

All database schema alterations in `supabase/migrations/` MUST adhere to the **Expand/Contract** design pattern to ensure compatibility with active running application instances during rolling or serverless deployments.

### Phase 1: Expand (Non-Breaking Addition)

- Add new columns as `NULLABLE` or with explicit default values.
- Create new tables or views alongside existing structures.
- Deploy database migrations BEFORE deploying code that consumes the new schema elements.

### Phase 2: Dual Write / Transition

- Server Actions and RPC functions write to both legacy and new schema structures if applicable.
- Backfill legacy data using batch background migration scripts.

### Phase 3: Contract (Deprecation)

- Update code to read exclusively from the new schema structures.
- Remove old columns/tables only AFTER all active serverless function invocations have rotated to the new application release version.

---

## 3. Database Migration CI/CD Pipeline Gates

1. **Linting:** Every PR containing SQL files in `supabase/migrations/` must run `supabase db lint`.
2. **Dry-Run Validation:** Dry-run migrations against a temporary ephemeral Supabase database container in CI.
3. **Forward-Only Policy:** Migration files are immutable once merged to `main`. Rollbacks must be performed via new forward-migrating SQL scripts.

---

## 4. Disaster Recovery (DR) & Backup SLAs

| Metric                             | Target SLA       | Strategy & Implementation                                                             |
| :--------------------------------- | :--------------- | :------------------------------------------------------------------------------------ |
| **RPO (Recovery Point Objective)** | **< 5 Minutes**  | Supabase Point-in-Time Recovery (PITR) via Continuous WAL Archiving.                  |
| **RTO (Recovery Time Objective)**  | **< 30 Minutes** | Automated Terraform infrastructure provisioning & Vercel deployment alias re-routing. |

### Restore Verification Protocol

- Automated monthly restore test: Restore latest PITR snapshot to a staging database and run `npm run test` against the restored DB.

---

## 5. Multi-Environment & Branch Promotion Policy

```
[ Feature Branch ] ──► Pull Request ──► [ CI Quality Gate ]
                                                │
                                                ▼ (Merge)
                                         [ develop Branch ]
                                                │ (Auto-Deploy)
                                                ▼
                                    [ Staging Environment ]
                                                │ (Manual Approval)
                                                ▼
                                         [ main Branch ]
                                                │ (Auto-Deploy)
                                                ▼
                                  [ Production Environment ]
```

---

## 6. Incident Management & Emergency Rollbacks

1. **Code Rollback:** In Vercel Console, promote previous successful Deployment Alias.
2. **Feature Toggle:** Disable affected feature flags in PostHog / Upstash.
3. **Database Emergency Patch:** Apply forward-fix SQL script if schema changes break production. Do NOT attempt out-of-order schema drops.

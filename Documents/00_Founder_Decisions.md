# 00_Founder_Decisions.md

> **Project:** RewardLoop (Working Name: Salon Rewards)
> **Version:** 1.1
> **Status:** 🔒 Locked
> **Purpose:** Master record of all founder decisions. Every future PRD, architecture, database, API, frontend, and backend document must follow these decisions.
> **Last updated:** 2026-07-14 — Contradiction resolution pass. See Appendix for full changelog.

---

# Table of Contents

1. Product Vision
2. Product Scope
3. Target Users
4. Platform Strategy
5. Authentication
6. First-Time Setup
7. Customer Management
8. Service Management
9. Visit Flow
10. Reward Engine
11. Reward Redemption
12. Payment Rules
13. Transactions
14. Dashboard
15. Insights
16. Navigation
17. Settings
18. States
19. Security
20. PWA Strategy
21. Data Ownership
22. Out of Scope
23. Success Metrics

---

# Decision 01 — Product Vision

**Status:** 🔒 Locked

## Vision

RewardLoop helps local salons retain customers through a simple digital loyalty system integrated directly into billing.

The objective is not to build CRM software.

The objective is to increase repeat customers while making billing faster.

---

## Core Principles

- Billing first
- Loyalty second
- CRM never

---

## Success Goal

Complete an entire customer visit in **under 12 seconds**.

---

# Decision 02 — Target Users

**Status:** 🔒 Locked

Primary Users

- Salon Owners
- Receptionists

Future Expansion

- Spa
- Gym
- Café
- Clinic
- Car Wash
- Kirana Store

---

# Decision 03 — Platform Strategy

**Status:** 🔒 Locked

Platform

- Progressive Web App (PWA)

Do NOT build

- Android App
- iOS App
- Desktop Software

Reasons

- Faster MVP
- Easy updates
- No Play Store approval
- Works on every device

---

# Decision 04 — Authentication

**Status:** 🔒 Locked

Authentication Method

- Mobile Number
- OTP

Rules

- OTP only during first login
- Passwords not supported
- Session persists
- One active device
- Device transfer supported

Flow

Login

↓

OTP

↓

Setup

↓

Dashboard

---

# Decision 05 — First-Time Setup

**Status:** 🔒 Locked

Flow

Shop Name

↓

Reward Rules

↓

Services

↓

Dashboard

---

### Shop Name

Required

---

### Reward Rules

Owner defines

- Reward %
- Maximum Redeem %

Examples

Reward: 10%

Maximum Redeem: 20%

---

### Services

Owner can

- Add
- Edit
- Delete

Suggested services available.

Historical transactions never change.

---

# Decision 06 — Customer Management

**Status:** 🔒 Locked

Customer identity is always based on:

- Phone Number

Rules

- Phone required
- Name optional
- Auto create customer if not found
- No customer creation screen

---

# Decision 07 — Customer Tab

**Status:** 🔒 Locked

Customer tab is removed.

Customer information only exists inside Visit Flow.

Bottom Navigation

Home

Transactions

-

Insights

More

---

# Decision 08 — Visit Flow

**Status:** 🔒 Locked

Workflow

Dashboard

↓

-

↓

Phone Number

↓

Search Customer

↓

Customer Found?

↓

Services

↓

Rewards

↓

Payment

↓

Complete

↓

Dashboard

Rules

- Single vertical flow
- Minimal typing
- Auto search
- Auto customer creation

---

# Decision 09 — Service Management

**Status:** 🔒 Locked

Supported

- Haircut
- Beard
- Facial
- Other

Other Service

Amount only

No name required.

---

# Decision 10 — Reward Engine

**Status:** 🔒 Locked

Reward Formula

Reward Earned

=

Final Paid

×

Reward %

NOT

Original Bill

Reason

Customer should never earn rewards on redeemed rewards.

---

# Decision 11 — Reward Redemption

**Status:** 🔒 Locked

Owner manually enters reward amount.

Display

- Available Reward
- Maximum Redeem

Validation

Allowed Reward

=

Minimum

- Reward Balance
- Maximum Redeem Rule

Rules

- Manual input only
- No quick chips
- No UseMaxButton (a UseMaxButton is functionally a quick chip and violates this rule)
- Final Pay updates instantly
- Minimum redemption: ₹1 (100 paise). Cannot redeem less than ₹1.

---

# Decision 12 — OTP Verification

**Status:** 🔒 Locked

Reward Earn

No OTP

Reward Redeem

OTP Required

OTP Length

**6 digits** — standardized across all OTP flows (login and reward redemption).

OTP Expiry

**3 minutes** from time of generation.

Max Attempts

**3 failed attempts** invalidate the OTP code. A new OTP must be requested.

Flow

Reward Used

↓

Send OTP

↓

Verify (6-digit)

↓

Complete Visit

If customer cannot verify

Continue Without Reward

↓

Reward becomes ₹0

↓

Complete Visit

---

# Decision 13 — Payment Methods

**Status:** 🔒 Locked

Supported

- Cash
- Online

Not Supported

- Split Payment
- Wallet
- Credit

---

# Decision 14 — Billing Completion

**Status:** 🔒 Locked

Backend Process

Save Transaction (atomic — all-or-nothing)

↓

Update Reward Wallet (within same atomic transaction)

↓

Send SMS (fire-and-forget, after atomic commit)

↓

Dashboard

UI

No success screen. No success page. No 3-second redirect.

Show

✓ Visit Completed

for **one second only** as a toast notification.

Then automatically navigate to Dashboard.

There is NO dedicated success page, summary card, or back-to-dashboard button.

---

# Decision 15 — Transactions

**Status:** 🔒 Locked

Recent First

Transaction Card

Show

- Bill
- Reward Used
- Final Paid
- Payment Method

Transaction Detail

- Services
- Bill
- Reward Used
- Final Paid
- Payment

Rules

- Edit within 5 minutes
- Delete not allowed
- Current reward balance never shown

---

# Decision 16 — Dashboard

**Status:** 🔒 Locked

Dashboard contains

- Today Revenue
- Customers
- Recent Transactions

Primary CTA

- Visit

Rules

- No charts
- No analytics
- Fast loading

---

# Decision 17 — Insights

**Status:** 🔒 Locked

Period

**Today only (MVP)**

Multi-period insights (Yesterday, Weekly, Monthly) are a **Phase 2** feature. Any document showing multi-period insights in MVP is incorrect. This document takes precedence.

Cards

- Today's Revenue (= sum of Final Paid today)
- Today's Customers (= distinct customers billed today)
- Today's Rewards Given (= sum of reward_earned today)

Rules

- No charts
- Bottom sheet detail on card tap
- Revenue = Final Paid (not Subtotal)

---

# Decision 18 — Navigation

**Status:** 🔒 Locked

Bottom Navigation

🏠 Home

📋 Transactions

➕

📊 Insights

☰ More

Removed

- Customers
- Reports
- Analytics

---

# Decision 19 — More Screen

**Status:** 🔒 Locked

Quick Actions

- Services
- Reward Rules
- Shop

Settings

- Notifications
- Help
- Logout

---

# Decision 20 — States

Loading

- Searching Customer
- Sending OTP
- Saving Transaction

Errors

- Offline
- Invalid OTP
- Customer Not Found

Empty States

Dashboard

"No visits yet"

Transactions

"No transactions yet"

Insights

"No data available"

---

# Decision 21 — Security

**Status:** 🔒 Locked

Rules

- OTP required only for redemption
- Single active device
- Reward wallet linked to verified phone
- Backend validates reward calculations
- Transactions immutable after edit window

---

# Decision 22 — PWA Strategy

**Status:** 🔒 Locked

Show Install Prompt

Only after

3 completed visits

Never on first launch.

---

# Decision 23 — Data Ownership

**Status:** 🔒 Locked

Business owns

- Customers
- Transactions
- Services
- Rewards
- Settings

Platform stores data only.

---

# Decision 24 — Out of Scope (MVP)

Do NOT build

- Customer App
- Staff Management (invite, approve, suspend, remove staff — Phase 2)
- Staff Roles and Role-based Permissions (Phase 2)
- Multi-shop / Multi-branch (Phase 2)
- Split Payment
- Refunds / Void
- Draft Billing (save-for-later)
- AI features
- Analytics Charts
- Loyalty Tiers
- Subscription Plan Management (in-app)
- WhatsApp Marketing
- Customer History Screen (Phase 2)
- Product catalog (only services in MVP)
- UseMaxButton (violates manual-entry-only rule)
- GST / Tax calculation
- Invoice generation
- PDF export

---

# Decision 25 — Success Metrics

| Metric             | Target       |
| ------------------ | ------------ |
| Billing Time       | ≤ 12 sec     |
| Setup Time         | ≤ 60 sec     |
| Login to Dashboard | ≤ 5 sec      |
| Learning Time      | ≤ 5 min      |
| Authentication     | OTP          |
| Platform           | PWA          |
| Customer Identity  | Phone Number |

---

# Founder Principles

Every future decision should satisfy these rules.

## Rule 1

Speed over Features.

---

## Rule 2

Every action should require no more than two taps.

---

## Rule 3

The product should feel like a billing tool, not an administrative system.

---

## Rule 4

Every feature must directly help increase customer retention.

---

## Rule 5

Never sacrifice checkout speed for additional functionality.

---

# Document Status

✅ Approved

🔒 Locked

This document is the single source of truth for all product, design, engineering, and architecture decisions for RewardLoop MVP.

---

# Appendix — Contradiction Resolution Log

Version 1.1 resolves the following contradictions identified in the documentation audit:

| C#    | Contradiction                                                                                     | Resolution                                                                                                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-001 | Insights period: This doc said "Today only" but API, UX, and Product Brief said multi-period      | **Resolved:** Today only. API Design v2.0 updated to match. Phase 2 note added to all affected documents.                                                                               |
| C-002 | Success screen: This doc said "1-second flash" but 04.5_Complete_Visit.md defined a 3-second page | **Resolved:** Decision 14 updated to be unambiguous. 04.5 development doc updated.                                                                                                      |
| C-003 | OTP length: Auth implied 6-digit, Reward Redemption said "4 preferred"                            | **Resolved:** Decision 12 updated to explicitly mandate 6 digits across all OTP flows.                                                                                                  |
| C-007 | OTP attempt limits: API Design said 5 attempts, Reward Redemption said 3 attempts                 | **Resolved:** Login OTP = 5 attempts (Supabase Auth default). Reward OTP = 3 attempts. Both documented in Decision 12.                                                                  |
| C-010 | UseMaxButton: Dev doc defined it, Decision 11 bans quick chips                                    | **Resolved:** Decision 11 updated to explicitly ban UseMaxButton. Dev doc 04.4 updated.                                                                                                 |
| C-011 | Reward % range: Onboarding says 1-50, DB said 0-100                                               | **Resolved:** 1-50 range locked in Decision 05, DB constraint updated.                                                                                                                  |
| C-012 | Products in catalog: Product Brief included products, Decision 09 implied services only           | **Resolved:** Decision 24 explicitly lists "Product catalog" as out of scope for MVP.                                                                                                   |
| Staff | Staff in API Design, Domain Model, Architecture but not in sprint docs                            | **Resolved:** Decision 24 updated to explicitly call out Staff Management as Phase 2. API v2.0 removes staff endpoints from MVP. features/staff/ folder removed from project structure. |

---

# Decision 26 — Production Locked Rules

**Status:** 🔒 Locked

These rules are explicitly locked and cannot drift during future development:

1. OTP redemption always uses the admin client.
2. Users created before onboarding always have `business_id = null`.
3. Dashboard KPIs are sourced only from `get_today_kpis` RPC.
4. All monetary calculations use integer paise.
5. PWA is the primary supported client.
6. Service Worker cache version must change with every release.
7. Every privileged operation must pass through authenticated business validation.

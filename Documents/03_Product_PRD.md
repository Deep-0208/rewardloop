# 03_Product_PRD.md

> **Project:** RewardLoop
> **Version:** 3.1
> **Status:** ✅ Approved — Ready for Development
> **Depends on:** 00_Founder_Decisions.md
> **Purpose:** The canonical product contract for RewardLoop MVP. Every functional requirement, business rule, acceptance criterion, and definition-of-done lives here. All sprint documents derive from this document. No feature may be built that is not defined here.

---

# Table of Contents

1. Executive Summary
2. Product Scope
3. User Personas
4. Functional Modules
5. Detailed User Flows
6. Business Rules
7. Functional Requirements
8. Non-Functional Requirements
9. Data Model Overview
10. Validation Rules
11. Permissions
12. Error Handling
13. Empty States
14. Loading States
15. Acceptance Criteria
16. Assumptions
17. Risks
18. Future Enhancements
19. Appendix — Glossary

---

# 1. Executive Summary

## Product

RewardLoop is a mobile-first Progressive Web App (PWA) that gives local salon owners a digital loyalty and billing system. Owners use it at the counter to log customer visits, charge bills, earn loyalty rewards for customers, and let customers redeem rewards on future visits.

## Vision

Make every salon visit faster and more loyal. Replace manual loyalty cards with a phone-number-based digital wallet that is effortless for both the owner and the customer.

## Goals

- **Speed:** Complete an entire customer visit in ≤12 seconds (non-redemption visits).
- **Simplicity:** A salon owner with no technical background can set up and start billing in ≤60 seconds.
- **Loyalty:** Automatically grow repeat customer visits through earned rewards without manual tracking.
- **Accuracy:** Eliminate calculation errors by automating reward math.

## Success Metrics

| Metric                               | Target       |
| ------------------------------------ | ------------ |
| Complete Visit (no redemption)       | ≤ 12 seconds |
| Complete Visit (with OTP redemption) | ≤ 45 seconds |
| Business Setup                       | ≤ 60 seconds |
| Login to Dashboard                   | ≤ 5 seconds  |
| Learning Time (new owner)            | ≤ 5 minutes  |
| Daily Active Business Rate (6-month) | ≥ 70%        |

---

# 2. Product Scope

## MVP Scope

The following features are in scope for MVP:

| Module                                                            | In Scope |
| ----------------------------------------------------------------- | -------- |
| Phone + OTP Authentication                                        | ✅       |
| Business Onboarding (Name, Type, Reward Rules, Catalog)           | ✅       |
| Customer Search & Auto-Create                                     | ✅       |
| Catalog-Based Billing                                             | ✅       |
| Reward Earning (auto, on Final Paid)                              | ✅       |
| Reward Redemption (manual entry + OTP)                            | ✅       |
| Cash / Online Payment Recording                                   | ✅       |
| Transaction History (list + detail + 5-min edit)                  | ✅       |
| Dashboard (Today Revenue + Customers + Recent Transactions)       | ✅       |
| Insights (Today only: Revenue, Customers, Rewards)                | ✅       |
| More / Settings (Catalog, Reward Rules, Business Profile, Logout) | ✅       |
| PWA Install + Offline Degradation                                 | ✅       |

## Future Scope (Phase 2+)

| Feature                   | Phase   |
| ------------------------- | ------- |
| Multi-branch              | Phase 2 |
| Staff Roles & Permissions | Phase 2 |
| WhatsApp Receipt          | Phase 2 |
| Refund / Void             | Phase 2 |
| Membership Tiers          | Phase 3 |
| Coupons / Promo Codes     | Phase 3 |
| Customer App (separate)   | Phase 3 |
| Analytics Charts          | Phase 3 |
| AI Recommendations        | Phase 4 |
| Export (CSV / PDF)        | Phase 2 |

## Out of Scope (MVP)

The following are explicitly NOT built in MVP (from `00_Founder_Decisions.md` Decision 24):

- Customer App
- Staff Roles & Access Control
- Multi-shop / Multi-branch
- Split Payment
- Refunds or Void
- Draft Billing (save-for-later)
- AI features
- Analytics charts
- Loyalty tiers
- Subscription plan management inside the app
- WhatsApp Marketing
- GST / Tax calculation
- Invoice generation
- Gift cards
- Coupon / promo codes

---

# 3. User Personas

## Persona 1: Salon Owner (Primary)

- **Who:** Independent salon owner operating 1 location, typically 20–200 customers per day.
- **Device:** Budget Android phone, Chrome browser, installed as PWA.
- **Technical Level:** Basic smartphone literacy. WhatsApp and UPI-fluent.
- **Pain Points:** Forgets customer loyalty cards, miscalculates discounts, cannot track repeat customers.
- **Goal:** Bill customers faster, keep them coming back.
- **Behavior:** Uses the app at the billing counter for every customer visit.

## Persona 2: Receptionist / Staff (Secondary)

- **Who:** Salon employee handling customer billing on behalf of the owner.
- **Device:** Shared counter device (Android phone or tablet).
- **Technical Level:** Same as Owner. Trained by owner.
- **Pain Points:** Doesn't want to make billing mistakes. Needs a fast interface.
- **Goal:** Complete each visit as quickly as possible.
- **Note:** In MVP, Staff log in with the Owner's account. Staff management is a Phase 2 feature.

## Persona 3: Customer (Indirect)

- **Who:** Salon customer who earns and redeems loyalty rewards.
- **Device:** Their own phone (for OTP SMS only).
- **Interaction:** Does not use the app. Receives SMS for OTP verification when redeeming rewards.
- **Goal:** Get rewarded for loyalty, redeem easily at the counter.

---

# 4. Functional Modules

## Authentication

Phone-number based login. OTP-only. No passwords. Sessions persist until logout. One active device at a time.

## Business Setup (Onboarding)

First-time setup covering: business name, business type, reward percentage, maximum redeem percentage, and initial service catalog. Completes in under 60 seconds.

## Customer Management

No dedicated customer screen. Customers are found (or auto-created) at the start of every visit via phone number. Name is optional.

## Catalog Management

Owners maintain a list of services and their prices in the More → Services section. During billing, staff selects from this catalog.

## Visit & Billing

The core workflow. Select customer → select catalog items → (optionally) enter and verify reward redemption → select payment method → complete visit.

## Reward Engine

Automatic calculation. Reward Earned = Final Paid × Reward %. Never calculated on Subtotal. Stored as integer paise in database.

## Reward Redemption

Manual entry by staff. OTP sent to customer phone when redemption amount > ₹0. Customer provides OTP verbally. Staff enters OTP to authorize deduction.

## Payments

Record Cash or Online payment. App does not process payments — it records them. Assumes payment confirmed externally (e.g., UPI app sound, physical cash).

## Transactions

Immutable financial history. 5-minute edit window (payment method only). Infinite scroll list. Search by phone/name. Filter by date/method/reward.

## Dashboard

Today's summary: Revenue, Customer Count, Recent Transactions. No charts. Fast loading.

## Insights

**Scope: Today only** (aligned with `00_Founder_Decisions.md` Decision 17).
Cards: Today's Revenue, Today's Customer Count, Today's Rewards Given.
Bottom sheet detail on tap.

## Notifications (SMS)

OTP delivery for: (1) Login authentication, (2) Reward redemption authorization.
Transaction confirmation SMS is sent after successful billing completion.
Provider: **MSG91** (selected for Indian SMS market, DLT compliance, reliable delivery).

## PWA

App installable to home screen. Shown after 3 completed visits. Offline: cached read-only access to Dashboard, Transactions, Catalog. Billing requires internet.

---

# 5. Detailed User Flows

## Login Flow

```
User opens app
    ↓
Enter phone number (10 digits, India, +91 prefix)
    ↓
Tap "Send OTP"
    ↓
Supabase Auth sends 6-digit OTP via MSG91 SMS
    ↓
Enter OTP (6 digits, auto-submit on completion)
    ↓
OTP verified by Supabase Auth
    ↓
New user? → Onboarding Flow
Existing user with business? → Dashboard
```

## Onboarding Flow

```
Step 1: Business Setup
    Enter business name (required, 2–50 chars)
    Select business type (dropdown)
    Tap Continue
    ↓
Step 2: Reward Rules
    Set Reward % (stepper, 1–50, default 10)
    Set Max Redeem % (stepper, 1–50, default 20)
    Live preview updates
    Tap Continue
    ↓
Step 3: Catalog Setup
    Tap suggested service chips to add
    Or type custom service name + price
    Tap Finish (catalog can be empty)
    ↓
Dashboard
```

## Add Visit Flow (No Redemption)

```
Tap + (Add Visit)
    ↓
Enter customer phone (10 digits)
    ↓
Customer found? → Show name + wallet balance
    Not found? → Auto-create new customer
    ↓
Select catalog items (one or more)
    ↓
Billing Engine computes Subtotal, Max Redeem, Reward Earned
    ↓
Reward screen: Enter ₹0 or skip (no OTP needed)
    ↓
Select payment method (Cash/Online, default: Cash)
    ↓
Tap Complete Visit
    ↓
Server saves transaction atomically:
    - Insert transaction + items
    - Insert reward_ledger (earned)
    - Update reward_wallets
    - Update customer stats
    ↓
Show ✓ Visit Completed toast (1 second)
    ↓
Dashboard (cache invalidated, fresh data)
```

**Target: ≤12 seconds total.**

## Add Visit Flow (With Redemption)

```
[Same as above through Billing Engine computation]
    ↓
Reward screen: Enter reward amount > 0
    ↓
Tap Apply Reward
    ↓
Server sends OTP via MSG91 to customer phone
    ↓
Customer reads SMS aloud, staff enters 6-digit OTP
    ↓
OTP verified on server (3-minute expiry, 3 attempts max)
    ↓
Billing Engine recalculates with reward applied
    ↓
Select payment method
    ↓
Tap Complete Visit
    ↓
Server saves transaction atomically:
    - Insert transaction + items
    - Insert reward_ledger (redeemed + earned)
    - Update reward_wallets (deduct + credit)
    - Update customer stats
    ↓
Show ✓ Visit Completed toast (1 second)
    ↓
Dashboard
```

**Target: ≤45 seconds total (SMS delivery dependent).**

## New Customer Auto-Create Flow

```
Enter phone number
    ↓
No customer found in DB
    ↓
System auto-creates customer record (phone only, name = null)
    ↓
System auto-creates reward_wallet (balance = 0, business_id = current business)
    ↓
Continue to catalog selection
```

No confirmation screen. Auto-creation is silent.

## Logout Flow

```
More → Logout
    ↓
Confirmation dialog: "Log out?"
    ↓
Supabase Auth sign out
    ↓
Clear all Zustand stores
    ↓
Redirect to Login screen
```

---

# 6. Business Rules

## Authentication Rules

| ID          | Rule                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| BR-AUTH-001 | Phone number is the only identity method.                                                 |
| BR-AUTH-002 | OTP is 6 digits.                                                                          |
| BR-AUTH-003 | OTP expires 3 minutes after generation.                                                   |
| BR-AUTH-004 | Maximum 5 OTP delivery attempts per 15 mins. Verification max: 5 for Login, 3 for Reward. |
| BR-AUTH-005 | Session persists across app restarts (Supabase session auto-refresh).                     |
| BR-AUTH-006 | Only one active device session at a time. New login invalidates previous session.         |
| BR-AUTH-007 | Passwords are not supported and must not be implemented.                                  |

## Business Rules

| ID         | Rule                                            |
| ---------- | ----------------------------------------------- |
| BR-BIZ-001 | One business record per user account (MVP).     |
| BR-BIZ-002 | Business name is required (2–50 characters).    |
| BR-BIZ-003 | Business type is required at onboarding.        |
| BR-BIZ-004 | Reward rules are required before first billing. |
| BR-BIZ-005 | Onboarding must complete in under 60 seconds.   |

## Customer Rules

| ID          | Rule                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| BR-CUST-001 | Customer identity is defined by phone number within a business. Same phone at different businesses = different customer records. |
| BR-CUST-002 | Phone number is required. Name is optional.                                                                                      |
| BR-CUST-003 | If customer phone not found, auto-create customer + wallet silently.                                                             |
| BR-CUST-004 | No dedicated customer creation screen.                                                                                           |
| BR-CUST-005 | Customer data is isolated per business (business_id).                                                                            |
| BR-CUST-006 | Wallet balance is per customer per business — not shared across businesses.                                                      |

## Catalog Rules

| ID         | Rule                                                                            |
| ---------- | ------------------------------------------------------------------------------- |
| BR-CAT-001 | Catalog supports services only in MVP (product type reserved for future).       |
| BR-CAT-002 | Price is required for each catalog item (integer, in paise, > 0).               |
| BR-CAT-003 | Service name is required (1–100 characters).                                    |
| BR-CAT-004 | Catalog items can be deactivated (not deleted) to preserve transaction history. |
| BR-CAT-005 | Historical transaction items snapshot the name and price at billing time.       |

## Billing Rules

| ID          | Rule                                                                                   |
| ----------- | -------------------------------------------------------------------------------------- |
| BR-BILL-001 | Subtotal = Sum of (selected item price × quantity).                                    |
| BR-BILL-002 | Max Allowed = Subtotal × (Max Redeem % / 100).                                         |
| BR-BILL-003 | Maximum Redeem = MIN(Customer Wallet Balance, Max Allowed).                            |
| BR-BILL-004 | Reward Applied = MIN(Staff Input, Maximum Redeem).                                     |
| BR-BILL-005 | Final Amount = Subtotal - Reward Applied. Final Amount ≥ 0.                            |
| BR-BILL-006 | Reward Earned = Final Amount × (Reward % / 100), rounded to nearest integer paise.     |
| BR-BILL-007 | Reward is calculated on Final Amount ONLY. Never on Subtotal.                          |
| BR-BILL-008 | All monetary values are stored as INTEGER in paise (1 rupee = 100 paise).              |
| BR-BILL-009 | All rounding uses integer math — no floating point in billing logic.                   |
| BR-BILL-010 | Client calculates for display speed only. Server recalculates all values at save time. |
| BR-BILL-011 | A ₹0 bill is valid (comped service). Payment method = 'none'.                          |

## Reward Rules

| ID         | Rule                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| BR-RWD-001 | Reward percentage range: 1–50 (integer).                                                                                                 |
| BR-RWD-002 | Max redeem percentage range: 1–50 (integer).                                                                                             |
| BR-RWD-003 | Reward rules are stored ONLY in the reward_rules table. The businesses table does NOT store reward configuration.                        |
| BR-RWD-004 | When reward rules change, only future transactions use the new rules. Historical transactions record the rule values at time of billing. |
| BR-RWD-005 | Minimum redeem amount: ₹1 (100 paise) if applying a reward.                                                                              |
| BR-RWD-006 | Wallet balance can never drop below ₹0.                                                                                                  |
| BR-RWD-007 | UseMaxButton is removed from MVP. Manual entry only (per Founder Decision 11).                                                           |

## Payment Rules

| ID         | Rule                                                                  |
| ---------- | --------------------------------------------------------------------- |
| BR-PAY-001 | Supported payment methods: cash, online.                              |
| BR-PAY-002 | Default payment method: cash.                                         |
| BR-PAY-003 | If Final Amount > 0, a payment method must be selected.               |
| BR-PAY-004 | If Final Amount = 0, payment method = 'none' (no selection required). |
| BR-PAY-005 | App records payment method only — it does not process payments.       |

## OTP Rules

| ID         | Rule                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| BR-OTP-001 | OTP for reward redemption is 6 digits (standardized across all OTP flows).          |
| BR-OTP-002 | OTP for login is 6 digits (Supabase Auth default).                                  |
| BR-OTP-003 | Reward OTP expires 3 minutes after generation.                                      |
| BR-OTP-004 | Maximum 3 failed OTP attempts before the code is invalidated.                       |
| BR-OTP-005 | Resend allowed after 30-second cooldown. Maximum 3 resends per session.             |
| BR-OTP-006 | OTP is never stored as plain text. Only bcrypt hash stored in DB.                   |
| BR-OTP-007 | OTP is required ONLY when reward_applied > 0. Zero-reward visits skip OTP entirely. |
| BR-OTP-008 | "Continue Without Reward" resets reward_applied to 0 and skips OTP.                 |

## Transaction Rules

| ID         | Rule                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------ |
| BR-TXN-001 | Transactions are immutable financial records once the 5-minute edit window closes.               |
| BR-TXN-002 | Only payment_method field is editable within the 5-minute window.                                |
| BR-TXN-003 | All edits create an immutable audit_log entry.                                                   |
| BR-TXN-004 | Subtotal, reward_used, reward_earned, final_paid are permanently immutable.                      |
| BR-TXN-005 | Transactions record reward_percentage_applied and max_redeem_percentage_applied at billing time. |
| BR-TXN-006 | All 4 write operations (transaction, items, ledger, wallet) succeed or none commit.              |
| BR-TXN-007 | Idempotency key prevents duplicate transaction creation on network retry.                        |

## Notification Rules

| ID           | Rule                                                                                    |
| ------------ | --------------------------------------------------------------------------------------- |
| BR-NOTIF-001 | SMS provider: MSG91 (DLT-registered, Indian market).                                    |
| BR-NOTIF-002 | OTP SMS is a blocking operation (reward cannot be applied without successful delivery). |
| BR-NOTIF-003 | Transaction confirmation SMS is fire-and-forget (does not block transaction save).      |
| BR-NOTIF-004 | SMS failures on transaction confirmation are logged but do not fail the transaction.    |
| BR-NOTIF-005 | All SMS use pre-approved DLT templates.                                                 |

---

# 7. Functional Requirements

## FR-AUTH: Authentication

| ID          | Requirement                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| FR-AUTH-001 | System shall provide a phone number input screen accepting 10-digit Indian mobile numbers. |
| FR-AUTH-002 | System shall send a 6-digit OTP via MSG91 SMS when the user taps Send OTP.                 |
| FR-AUTH-003 | System shall verify the OTP using Supabase Auth within 3 minutes.                          |
| FR-AUTH-004 | System shall redirect new users to onboarding after successful first login.                |
| FR-AUTH-005 | System shall redirect returning users with a business to the Dashboard.                    |
| FR-AUTH-006 | System shall persist the session across browser restarts until explicit logout.            |
| FR-AUTH-007 | System shall invalidate the previous session when a user logs in on a new device.          |
| FR-AUTH-008 | System shall enforce a 5-attempt rate limit per phone per 15 minutes on OTP requests.      |

## FR-ONBOARD: Onboarding

| ID        | Requirement                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------ |
| FR-ON-001 | System shall guide the user through exactly 3 onboarding steps: Business Setup, Reward Rules, Catalog. |
| FR-ON-002 | System shall require business name (2–50 chars) and business type before proceeding to Step 2.         |
| FR-ON-003 | System shall allow reward percentage configuration between 1 and 50.                                   |
| FR-ON-004 | System shall allow max redeem percentage configuration between 1 and 50.                               |
| FR-ON-005 | System shall display a live reward preview on Step 2.                                                  |
| FR-ON-006 | System shall allow catalog to be empty at the end of Step 3.                                           |
| FR-ON-007 | System shall preserve entered data when the user navigates back between steps.                         |
| FR-ON-008 | System shall redirect to the Dashboard on onboarding completion.                                       |
| FR-ON-009 | System shall restore onboarding progress on page refresh.                                              |

## FR-CUST: Customer Management

| ID          | Requirement                                                                      |
| ----------- | -------------------------------------------------------------------------------- |
| FR-CUST-001 | System shall search for a customer by exact 10-digit phone number.               |
| FR-CUST-002 | System shall display customer name and reward wallet balance if customer exists. |
| FR-CUST-003 | System shall auto-create a new customer (phone + null name) if not found.        |
| FR-CUST-004 | System shall auto-create a reward wallet (balance = 0) for new customers.        |
| FR-CUST-005 | System shall not show a customer creation confirmation screen.                   |

## FR-CAT: Catalog Management

| ID         | Requirement                                                                   |
| ---------- | ----------------------------------------------------------------------------- |
| FR-CAT-001 | System shall allow owners to create catalog items with name and price.        |
| FR-CAT-002 | System shall allow owners to edit catalog item name and price.                |
| FR-CAT-003 | System shall allow owners to deactivate (soft-delete) catalog items.          |
| FR-CAT-004 | System shall not allow deletion of catalog items that appear in transactions. |
| FR-CAT-005 | System shall display only active catalog items during billing.                |
| FR-CAT-006 | System shall support a maximum of 100 active catalog items per business.      |

## FR-BILL: Billing

| ID          | Requirement                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| FR-BILL-001 | System shall allow selecting one or more catalog items during billing.                                    |
| FR-BILL-002 | System shall compute Subtotal in real time as items are added or removed.                                 |
| FR-BILL-003 | System shall compute Maximum Redeem = MIN(Wallet Balance, Subtotal × Max Redeem %) in real time.          |
| FR-BILL-004 | System shall allow staff to manually enter a reward redemption amount.                                    |
| FR-BILL-005 | System shall automatically clamp reward input to Maximum Redeem on blur.                                  |
| FR-BILL-006 | System shall compute Final Amount = Subtotal − Reward Applied in real time.                               |
| FR-BILL-007 | System shall compute Reward Earned = Final Amount × Reward % (rounded to nearest integer paise).          |
| FR-BILL-008 | System shall recalculate all values on the server at time of save, independent of client values.          |
| FR-BILL-009 | System shall reject any server request where client-submitted totals do not match server-computed totals. |
| FR-BILL-010 | System shall require OTP verification if reward_applied > 0.                                              |
| FR-BILL-011 | System shall complete the full transaction save atomically (all-or-nothing).                              |

## FR-TXN: Transactions

| ID         | Requirement                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| FR-TXN-001 | System shall display a chronological list of transactions (newest first).                                    |
| FR-TXN-002 | System shall support infinite-scroll pagination of the transaction list.                                     |
| FR-TXN-003 | System shall support search by customer phone number and customer name.                                      |
| FR-TXN-004 | System shall support filtering by: today, yesterday, this week, this month; payment method; reward usage.    |
| FR-TXN-005 | System shall display a detailed view of each transaction showing items, totals, payment method, and rewards. |
| FR-TXN-006 | System shall allow editing the payment method field within 5 minutes of transaction creation.                |
| FR-TXN-007 | System shall reject edit requests after the 5-minute window (server-enforced).                               |
| FR-TXN-008 | System shall create an audit_log entry for every successful edit.                                            |

## FR-DASH: Dashboard

| ID          | Requirement                                                                              |
| ----------- | ---------------------------------------------------------------------------------------- |
| FR-DASH-001 | System shall display today's total revenue (sum of final_paid for today's transactions). |
| FR-DASH-002 | System shall display today's customer count (distinct customers billed today).           |
| FR-DASH-003 | System shall display the 5 most recent transactions as cards.                            |
| FR-DASH-004 | System shall display a primary CTA: "+ Add Visit".                                       |
| FR-DASH-005 | System shall load the dashboard in under 500ms from cache.                               |

## FR-INSIGHTS: Insights

| ID         | Requirement                                                            |
| ---------- | ---------------------------------------------------------------------- |
| FR-INS-001 | System shall display insights for **Today only**.                      |
| FR-INS-002 | System shall display today's total revenue.                            |
| FR-INS-003 | System shall display today's total customer count.                     |
| FR-INS-004 | System shall display total rewards given today (sum of reward_earned). |
| FR-INS-005 | System shall show detail in a bottom sheet on card tap.                |
| FR-INS-006 | System shall not display charts in MVP.                                |

## FR-MORE: More / Settings

| ID          | Requirement                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------- |
| FR-MORE-001 | System shall provide access to: Services (catalog), Reward Rules, Business Profile, Logout. |
| FR-MORE-002 | System shall allow editing business name and type.                                          |
| FR-MORE-003 | System shall allow editing reward percentage and max redeem percentage.                     |
| FR-MORE-004 | System shall allow adding, editing, and deactivating catalog items.                         |
| FR-MORE-005 | System shall confirm logout with a dialog before signing out.                               |

---

# 8. Non-Functional Requirements

## Performance

| ID           | Requirement                                                     |
| ------------ | --------------------------------------------------------------- |
| NFR-PERF-001 | Visit flow (no redemption) completes in ≤12 seconds.            |
| NFR-PERF-002 | Dashboard loads in ≤500ms (from cache).                         |
| NFR-PERF-003 | Server Action response for completeVisit: ≤2 seconds.           |
| NFR-PERF-004 | OTP send response: ≤2 seconds.                                  |
| NFR-PERF-005 | Customer search response: ≤500ms.                               |
| NFR-PERF-006 | App launch (from PWA cache): ≤1.5 seconds.                      |
| NFR-PERF-007 | Billing Engine client calculation: <5ms (synchronous, Zustand). |

## Security

| ID          | Requirement                                                        |
| ----------- | ------------------------------------------------------------------ |
| NFR-SEC-001 | All API endpoints require Supabase Auth session (JWT).             |
| NFR-SEC-002 | RLS enforces business_id isolation on every database table.        |
| NFR-SEC-003 | Server recalculates all billing totals independently of client.    |
| NFR-SEC-004 | OTP hashed with bcrypt before storage. Never stored as plain text. |
| NFR-SEC-005 | OTP reward token is validated server-side during completeVisit.    |
| NFR-SEC-006 | Single-device session enforced via session_version in users table. |
| NFR-SEC-007 | HTTPS enforced on all production traffic.                          |
| NFR-SEC-008 | No secrets exposed to client-side code.                            |
| NFR-SEC-009 | Idempotency key prevents duplicate transaction creation.           |
| NFR-SEC-010 | Rate limiting applied to all OTP and write operations.             |

## Reliability

| ID          | Requirement                                                |
| ----------- | ---------------------------------------------------------- |
| NFR-REL-001 | Transaction save is atomic. Partial saves are not allowed. |
| NFR-REL-002 | Wallet balance never becomes negative.                     |
| NFR-REL-003 | Reward ledger is append-only and immutable.                |
| NFR-REL-004 | App degrades gracefully offline (read-only cached data).   |
| NFR-REL-005 | Target uptime: 99.9% (Supabase SLA + Vercel SLA).          |

## Scalability

| ID            | Requirement                                                           |
| ------------- | --------------------------------------------------------------------- |
| NFR-SCALE-001 | Schema supports up to 10,000 businesses without structural change.    |
| NFR-SCALE-002 | Insights queries use indexed columns only (business_id + created_at). |
| NFR-SCALE-003 | Transaction list uses cursor-based pagination.                        |
| NFR-SCALE-004 | No SELECT * queries.                                                  |

## Usability

| ID          | Requirement                                                   |
| ----------- | ------------------------------------------------------------- |
| NFR-USE-001 | App is mobile-first (360px–430px primary target).             |
| NFR-USE-002 | All touch targets are ≥48×48px.                               |
| NFR-USE-003 | One primary CTA per screen.                                   |
| NFR-USE-004 | No more than 3 taps to reach any core feature from Dashboard. |

## Accessibility

| ID          | Requirement                                                 |
| ----------- | ----------------------------------------------------------- |
| NFR-ACC-001 | WCAG AA contrast ratio (4.5:1 minimum).                     |
| NFR-ACC-002 | Semantic HTML with proper ARIA labels on icon-only buttons. |
| NFR-ACC-003 | Visible focus states on all interactive elements.           |
| NFR-ACC-004 | prefers-reduced-motion respected for all animations.        |
| NFR-ACC-005 | Screen reader compatible (VoiceOver, TalkBack).             |

## Availability

| ID            | Requirement                                                                |
| ------------- | -------------------------------------------------------------------------- |
| NFR-AVAIL-001 | PWA serves cached pages offline (Dashboard, Transactions, Settings).       |
| NFR-AVAIL-002 | Billing and OTP require internet connection (server validation mandatory). |
| NFR-AVAIL-003 | Offline banner shown within 1 second of network loss.                      |

---

# 9. Data Model Overview

| Entity              | Purpose                           | Key Relationships                               |
| ------------------- | --------------------------------- | ----------------------------------------------- |
| `businesses`        | One per subscribed salon          | Owns: users, customers, catalog, transactions   |
| `users`             | Owner/staff accounts              | Belongs to: business; linked to: auth.users     |
| `customers`         | Business customers                | Belongs to: business; has: wallet, transactions |
| `catalogs`          | One catalog per business          | Belongs to: business; has: catalog_items        |
| `catalog_items`     | Services (MVP; products Phase 2)  | Belongs to: catalog + business (denormalized)   |
| `reward_rules`      | Reward + redeem % config          | Belongs to: business (one active record)        |
| `reward_wallets`    | Per-customer per-business balance | Belongs to: customer + business                 |
| `reward_ledger`     | Immutable reward history          | Belongs to: wallet; linked to: transaction      |
| `transactions`      | Completed billing records         | Belongs to: business + customer                 |
| `transaction_items` | Line items snapshot               | Belongs to: transaction                         |
| `otp_requests`      | OTP tracking                      | Linked to: phone + business                     |
| `idempotency_keys`  | Duplicate prevention              | Linked to: business + customer                  |
| `notifications`     | SMS delivery log                  | Linked to: business + customer                  |
| `audit_logs`        | Edit and security events          | Linked to: business + user + entity             |

---

# 10. Validation Rules

## Phone Number

- Format: 10 digits, numeric only
- Country: India (+91 prefix)
- Stored as E.164: `+91XXXXXXXXXX` (12 characters)
- Unique per business for customers
- Unique globally for users/auth

## Reward Percentage

- Type: INTEGER (1–50)
- Unit: Percent
- Cannot be 0 (must earn something)
- Cannot exceed 50 (business protection)

## Max Redeem Percentage

- Type: INTEGER (1–50)
- Unit: Percent of subtotal
- Cannot be 0

## Price / Monetary Values

- Type: INTEGER
- Unit: Paise (1 INR = 100 paise)
- Minimum price: 100 paise (₹1)
- Maximum price: 99,999,900 paise (₹9,99,999)
- No floats, no decimals in database or server arithmetic

## OTP Code

- Length: 6 digits
- Type: Numeric string
- Expiry: 3 minutes
- Attempts: Maximum 3 failures

## Business Name

- Length: 2–50 characters
- Required
- Trimmed of whitespace

## Catalog Item Name

- Length: 1–100 characters
- Required
- Trimmed

## Quantity

- Type: INTEGER
- Minimum: 1

---

# 11. Permissions

## MVP Permission Model

In MVP, all authenticated users with a business have full owner-level access. Staff management is a Phase 2 feature.

| Action                   | Owner (MVP) |
| ------------------------ | ----------- |
| View Dashboard           | ✅          |
| Add Visit                | ✅          |
| View Transactions        | ✅          |
| Edit Transaction (5-min) | ✅          |
| View Insights            | ✅          |
| Manage Catalog           | ✅          |
| Manage Reward Rules      | ✅          |
| Edit Business Profile    | ✅          |
| Logout                   | ✅          |

## Phase 2 Permission Model (Future — do not implement in MVP)

| Action              | Owner | Staff |
| ------------------- | ----- | ----- |
| Add Visit           | ✅    | ✅    |
| Manage Catalog      | ✅    | ❌    |
| Change Reward Rules | ✅    | ❌    |
| View Insights       | ✅    | ✅    |
| Delete Business     | ✅    | ❌    |

---

# 12. Error Handling

## Validation Errors

- Displayed inline below the relevant field.
- Field border changes to `color-error` (#EF4444).
- Error message appears in `caption` size text.
- Form cannot submit while validation errors exist.

## Authentication Errors

| Error            | Message                                  | Action             |
| ---------------- | ---------------------------------------- | ------------------ |
| Invalid phone    | "Enter a valid 10-digit phone number."   | Inline field error |
| OTP expired      | "Code expired. Request a new one."       | Show Resend button |
| OTP invalid      | "Incorrect code. Try again."             | Clear input, retry |
| OTP max attempts | "Too many attempts. Request a new code." | Force resend       |
| Rate limited     | "Too many requests. Wait 15 minutes."    | Disable Send OTP   |

## Network Errors

| Scenario        | Message                                   | Action         |
| --------------- | ----------------------------------------- | -------------- |
| Offline         | "You are offline."                        | Offline banner |
| Request timeout | "Connection timed out. Please retry."     | Retry button   |
| Server error    | "Something went wrong. Please try again." | Retry button   |

## Business Rule Errors

| Error                 | Message                                | Action                |
| --------------------- | -------------------------------------- | --------------------- |
| Reward exceeds limit  | "Exceeds maximum redeemable amount."   | Auto-clamp on blur    |
| Wallet insufficient   | "Customer has no rewards."             | Disable reward input  |
| Duplicate transaction | "This visit was already saved."        | Redirect to dashboard |
| Edit window expired   | "The 5-minute edit window has closed." | Hide edit button      |

---

# 13. Empty States

| Screen                           | Empty State Text                             | CTA           |
| -------------------------------- | -------------------------------------------- | ------------- |
| Dashboard (no visits today)      | "No visits today. Tap + to start."           | + Add Visit   |
| Transactions (no transactions)   | "No transactions yet."                       | None          |
| Transactions (search no results) | "No results for '[query]'."                  | Clear Search  |
| Transactions (filter no results) | "No transactions match these filters."       | Clear Filters |
| Insights (no data today)         | "No data available today."                   | None          |
| Catalog (no items)               | "No services added. Add your first service." | Add Service   |

---

# 14. Loading States

| Action                     | Loading Indicator                              |
| -------------------------- | ---------------------------------------------- |
| Customer search            | Spinner inside search input                    |
| Sending OTP                | Spinner on Send OTP button, button disabled    |
| Verifying OTP              | Spinner on Verify button, input disabled       |
| Saving transaction         | Full-screen semi-transparent overlay + spinner |
| Loading transaction list   | Skeleton rows                                  |
| Loading transaction detail | Skeleton card                                  |
| Loading dashboard          | Skeleton stats cards                           |
| Loading insights           | Skeleton insight cards                         |

All loading states disable the primary action button to prevent double-taps.

---

# 15. Acceptance Criteria

## Authentication AC

- [ ] User can enter phone number and receive a 6-digit SMS OTP within 2 seconds.
- [ ] OTP auto-submits when 6th digit is entered.
- [ ] Correct OTP navigates to Dashboard or Onboarding.
- [ ] Incorrect OTP shows inline error. Input clears for retry.
- [ ] After 5 OTP send attempts in 15 minutes, user sees rate limit message.
- [ ] Session persists after app close and reopen.
- [ ] Logging in on device B signs out device A.

## Onboarding AC

- [ ] All 3 steps complete in under 60 seconds with correct inputs.
- [ ] Business name validates 2–50 character range.
- [ ] Reward % stepper is bounded 1–50.
- [ ] Max Redeem % stepper is bounded 1–50.
- [ ] Reward preview updates in real-time on Step 2.
- [ ] Catalog can be completed with zero services.
- [ ] Duplicate service names are prevented.
- [ ] Navigating back preserves all previously entered data.
- [ ] Page refresh restores correct step position.

## Billing AC

- [ ] Subtotal equals exact sum of selected items × quantities.
- [ ] Maximum Redeem correctly calculated and displayed.
- [ ] Manual reward input clamps to Maximum Redeem on blur.
- [ ] Final Amount = Subtotal − Reward Applied (always ≥ 0).
- [ ] Reward Earned = Final Amount × Reward % (rounded, integer paise).
- [ ] Reward never calculated on Subtotal.
- [ ] OTP is triggered when reward > 0. OTP skipped when reward = 0.
- [ ] Server recalculates and rejects mismatching client totals.
- [ ] All 4 DB writes (transaction, items, ledger, wallet) succeed or all fail.
- [ ] Wallet balance never goes negative.
- [ ] ✓ Visit Completed toast shows for 1 second then auto-navigates to Dashboard.

## Transaction AC

- [ ] Transactions display newest first.
- [ ] Infinite scroll loads more transactions.
- [ ] Search by phone finds correct customer.
- [ ] Search by name (partial) finds correct customer.
- [ ] Filter by date (today, yesterday, week, month) returns correct subset.
- [ ] Transaction detail shows all items, subtotal, reward, final paid, payment method.
- [ ] Edit button visible only within 5 minutes of creation.
- [ ] Server rejects edit after 5-minute window.
- [ ] Only payment_method can be changed via edit.
- [ ] Every edit creates an audit_log entry.

## Dashboard AC

- [ ] Today's revenue = sum of final_paid for today's transactions.
- [ ] Today's customers = distinct customer count for today.
- [ ] 5 most recent transactions shown.
- [ ] Dashboard refreshes after each completed visit without full page reload.

## Insights AC

- [ ] Insights shows Today's data only.
- [ ] Today's revenue matches Dashboard today's revenue exactly.
- [ ] Tapping a card opens a bottom sheet with detail breakdown.
- [ ] Empty state shown when no visits today.

---

# 16. Assumptions

1. Business owners use Android phones (Chrome browser) as the primary device.
2. Customers have Indian mobile numbers capable of receiving SMS.
3. Internet connectivity is available at the billing counter (WiFi or 4G).
4. The owner performs billing personally or delegates to a single trusted staff member using their credentials.
5. Payments are verified externally (UPI sound box, PhonePe app, physical cash) before tapping Complete Visit.
6. MSG91 DLT template approval is completed before launch.

---

# 17. Risks

| Risk                            | Probability     | Impact                      | Mitigation                                     |
| ------------------------------- | --------------- | --------------------------- | ---------------------------------------------- |
| SMS delivery failure            | Medium          | High (auth and OTP blocked) | MSG91 has 99%+ delivery. Show "Resend" option. |
| Supabase downtime               | Low             | Critical (app unusable)     | Offline cache for read-only. Monitor uptime.   |
| Owner enters wrong reward       | Medium          | Medium (financial error)    | 5-minute edit window. Audit trail.             |
| Customer refuses OTP (no phone) | Low             | Low                         | "Continue Without Reward" always available.    |
| Safari iOS PWA limitations      | High            | Medium                      | Document iOS install steps. Test on Safari.    |
| Floating-point billing errors   | Low (mitigated) | Critical                    | Integer-only paise arithmetic mandated.        |

---

# 18. Future Enhancements

## Phase 2

- Staff management (invite, suspend, remove)
- WhatsApp receipt after visit
- Transaction export (CSV)
- Multi-date insights (Yesterday, Week, Month)
- Refund / Void workflow
- Customer history view

## Phase 3

- Multi-branch / Multi-location
- Membership tiers
- Coupons and promo codes
- Customer app (separate product)
- Analytics charts and reports
- PDF invoice generation

## Phase 4

- AI-powered insights ("Your revenue drops on Tuesdays")
- Gift cards
- Native app wrapper (Capacitor)
- Payment gateway integration

---

# 19. Appendix — Glossary

| Term                 | Definition                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Business**         | A subscribed salon (or similar) using RewardLoop. Has one owner in MVP.                                            |
| **User**             | The authenticated person (owner or future staff) using the RewardLoop app.                                         |
| **Customer**         | A patron of the business who receives services. Identity = phone number.                                           |
| **Catalog**          | The list of services a business offers, with prices.                                                               |
| **Catalog Item**     | A single service (e.g., "Haircut — ₹200").                                                                         |
| **Visit**            | One customer interaction at the counter resulting in a billing event. Becomes a Transaction.                       |
| **Transaction**      | The immutable financial record of a completed visit.                                                               |
| **Transaction Item** | A line item within a transaction (service name + price snapshot at billing time).                                  |
| **Billing Session**  | The ephemeral client-side state during an active visit (Zustand store). Cleared after transaction saves.           |
| **Subtotal**         | Sum of all selected catalog item prices × quantities.                                                              |
| **Maximum Redeem**   | The maximum rupee amount a customer may redeem on a specific bill = MIN(Wallet Balance, Subtotal × Max Redeem %).  |
| **Reward Applied**   | The rupee amount of rewards actually deducted from the bill. Also called `reward_used` in the database.            |
| **Final Amount**     | The amount the customer must actually pay = Subtotal − Reward Applied. Also called `final_paid`.                   |
| **Reward Earned**    | The loyalty credit the customer gains this visit = Final Amount × Reward %.                                        |
| **Reward Wallet**    | The customer's current loyalty balance for a specific business. Per customer, per business.                        |
| **Reward Ledger**    | The append-only, immutable history of every earned and redeemed reward event.                                      |
| **Billing Engine**   | The pure-function module (`billing-math.ts`) that performs all monetary calculations.                              |
| **completeVisit**    | The Supabase RPC function that atomically saves a transaction, ledger entries, wallet update, and customer stats.  |
| **OTP**              | One-Time Password. 6-digit numeric code sent via SMS. Used for login and reward redemption authorization.          |
| **Idempotency Key**  | A UUIDv4 generated per checkout session to prevent duplicate transaction creation on network retry.                |
| **Paise**            | The smallest Indian currency unit. 1 INR = 100 paise. All monetary database values are stored in paise as INTEGER. |
| **RLS**              | Row Level Security. PostgreSQL feature enforced by Supabase to isolate data per business_id.                       |
| **Insights Period**  | Today only (MVP). Multi-period insights are a Phase 2 feature.                                                     |
| **Audit Log**        | An append-only record of all security-relevant events and data mutations.                                          |
| **Idempotency**      | The property that performing an operation multiple times produces the same result as performing it once.           |
| **MSG91**            | The selected SMS provider for India-market OTP and notification delivery.                                          |
| **DLT**              | Distributed Ledger Technology — India's TRAI-mandated SMS template registration system.                            |

---

# Document Status

✅ **Approved**
🔒 **Locked**

**Version 3.1** — Fully specified, implementation-ready Product Requirements Document.

This document is the canonical product contract for RewardLoop MVP. All sprint documents, API designs, database schemas, and UI specifications must be consistent with this document.

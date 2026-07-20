# 04_Domain_Model.md

> **Project:** RewardLoop
>
> **Version:** 1.1
>
> **Status:** 🔒 Approved
>
> **Purpose:** Define the core business entities, their responsibilities, relationships, ownership, and lifecycle. This document represents the business domain and serves as the foundation for database design, backend architecture, API contracts, and frontend state management.
>
> **Last updated:** 2026-07-14 — Aligned with Founder Decisions v1.1. Products moved to Phase 2. Staff entity clarified as Phase 2.

---

# What is a Domain Model?

A Domain Model describes the real-world objects (entities) that exist in RewardLoop and how they relate to one another.

It is independent of:

- Database technology
- Programming language
- UI implementation
- API design

This document focuses only on business concepts.

---

# Domain Principles

- Every entity has a single responsibility.
- Every entity has a unique identity.
- Entities are independent of implementation.
- Business rules belong to the domain.
- Relationships must reflect real-world behavior.

---

# Core Domain

RewardLoop consists of the following business entities:

1. Business
2. User
3. Customer
4. Catalog
5. Catalog Item
6. Transaction
7. Transaction Item
8. Reward Wallet
9. Reward Ledger
10. OTP Verification
11. Notification
12. Audit Log

---

# Entity 1 — Business

Represents one subscribed business.

Examples:

- Royal Salon
- Elite Car Wash
- Fitness Hub

Responsibilities:

- Owns all business data.
- Defines reward rules.
- Owns catalog.
- Owns customers.
- Owns staff.
- Owns transactions.

Relationships:

Business

├── Users

├── Customers

├── Catalog

├── Transactions

├── Reward Rules

└── Notifications

---

# Entity 2 — User

Represents a person who can log in to RewardLoop.

**MVP: Only Owner role exists.** Staff role is a Phase 2 feature (Founder Decision 24). Do not implement staff invite flows, staff approval, or role-based permissions in MVP.

Properties:

- Phone Number (identity)
- Role: `owner` (MVP only). `staff` is Phase 2.
- Status: Active / Suspended / Removed
- session_version (INTEGER) — increments on each new login for single-device enforcement.

Owner responsibilities:

- Login
- Billing
- Customer lookup
- Reward redemption
- Catalog management
- Reward Rules configuration
- Business Settings
- View Dashboard and Insights

Relationship:

Business

↓

Users (owner only in MVP)

---

# Entity 3 — Customer

Represents a customer belonging to one business.

Identity:

Phone Number

Properties:

- Name (Optional)
- Reward Wallet
- Visit History
- Transactions

Business Rules:

- Same phone number may exist in multiple businesses.
- Customer belongs only to one business context.

---

# Entity 4 — Catalog

Represents the collection of billable items offered by a business.

Contains:

- Services (MVP)
- Products (Phase 2 — see Decision 24)

Only one catalog exists per business.

---

# Entity 5 — Catalog Item

Represents one billable item.

**MVP: Services only.**

Examples (MVP — Services):

- Haircut
- Beard
- Facial
- Spa Treatment
- Gym Session

Products (Shampoo, Protein Powder, etc.) are **Phase 2** and are listed in Decision 24 as out of scope for MVP.

Properties:

- Name
- Type: `service` (always `service` in MVP)
- Price (stored in paise — INTEGER. 1 INR = 100 paise. See monetary standard in `06_Database_Design.md`.)
- Status (Active / Inactive)

Status:

- Active
- Inactive

---

# Entity 6 — Transaction

Represents one completed billing session.

Contains:

- Customer
- Items
- Reward Earned
- Reward Used
- Payment Method
- Final Paid

Transactions are immutable after the edit window.

---

# Entity 7 — Transaction Item

Represents an individual line item within a transaction.

Properties:

- Catalog Item
- Quantity
- Unit Price
- Line Total

Purpose:

Preserves historical pricing even if catalog prices change.

---

# Entity 8 — Reward Wallet

Represents the customer's current reward balance.

One wallet exists per:

Customer + Business

Stores:

- Current Balance

Only current value.

History is stored separately.

---

# Entity 9 — Reward Ledger

Represents the complete history of reward activity.

Records:

- Earn
- Redeem
- Adjustment (Future)

Purpose:

Maintain a permanent financial history.

Never edited.

Never deleted.

---

# Entity 10 — OTP Verification

Represents temporary verification requests.

Used for:

- Login
- Reward Redemption

Temporary entity.

Automatically expires.

---

# Entity 11 — Notification

Represents outgoing customer communication.

Examples:

- SMS
- WhatsApp (Future)

Types:

- Transaction Confirmation
- OTP
- Reward Redemption

---

# Entity 12 — Audit Log

Internal system log.

Purpose:

- Debugging
- Security
- Support

Not visible to businesses in MVP.

Never edited.

Never deleted.

---

# Entity Relationships

Business

↓

Users

↓

Transactions

↓

Transaction Items

↓

Catalog Items

Business

↓

Customers

↓

Reward Wallet

↓

Reward Ledger

Business

↓

Catalog

↓

Catalog Items

Business

↓

Audit Logs

Business

↓

Notifications

---

# Ownership Rules

Business owns:

- Users
- Customers
- Catalog
- Transactions
- Reward Wallets
- Reward Ledger
- Notifications

Customer owns:

- Phone Number
- Identity

RewardLoop owns:

- Platform
- Authentication
- Infrastructure

---

# Lifecycle Overview

Business

Created

↓

Active

↓

Suspended

↓

Archived

---

User

**MVP:** Owner only. No invite flow. User is created on first OTP login.

First Login

↓

Active (owner)

↓

Suspended (if business suspended by platform)

**Phase 2:** Staff invite flow (Invited → Active → Suspended → Removed).

---

Customer

Created Automatically

↓

Active

↓

Archived (Future)

---

Catalog Item

Created

↓

Active

↓

Inactive

---

Transaction

Created

↓

Editable (5 Minutes)

↓

Locked

---

Reward Wallet

Created Automatically

↓

Updated

↓

Active Forever

---

Reward Ledger

Created

↓

Append Only

↓

Permanent

---

# Domain Rules

- Every Business has one Catalog.
- Every Customer has one Reward Wallet per Business.
- Every Transaction belongs to one Business.
- Every Transaction belongs to one Customer.
- Every Transaction contains one or more Transaction Items.
- Every Reward Ledger entry belongs to one Reward Wallet.
- Every User belongs to one Business.
- Every Catalog Item belongs to one Catalog.
- Every Notification belongs to one Business.

---

# Future Domain Expansion

The current domain model supports future additions without structural redesign.

Possible future entities:

- Membership Plan
- Coupon
- Campaign
- Referral
- Gift Card
- Branch
- Subscription
- Invoice
- Payment Gateway
- AI Recommendation

These entities should integrate with the existing model rather than replacing it.

---

# Document Status

✅ Approved

This document defines the business domain for RewardLoop and serves as the foundation for:

- Database Design
- Backend Architecture
- API Design
- Frontend State Management
- System Architecture

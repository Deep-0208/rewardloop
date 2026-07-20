# 05_System_Architecture.md

> Project: RewardLoop
>
> Version: 1.1
>
> Status: 🔒 Approved
>
> Purpose: Define the high-level architecture of RewardLoop, including major system components, responsibilities, communication flow, technology stack, and architectural principles.
>
> Last updated: 2026-07-14 — Aligned with Founder Decisions v1.1. Staff Service, taxes, and product catalog clarified as Phase 2.

---

# Architecture Philosophy

RewardLoop follows a modern SaaS architecture based on:

- Simplicity
- Scalability
- Security
- Maintainability
- Clear separation of responsibilities

Every component should have a single responsibility.

---

# High-Level Architecture

```
                User

                  │

      Next.js 15 PWA (Modular Monolith)
      Server Actions (business logic)
      Middleware (auth guard)

                  │

──────────────────────────────────

         Supabase Platform

    PostgreSQL + RLS (data isolation)
    Auth (Phone OTP → JWT + session_version)
    Storage (business logos)
    Edge Functions (SMS delivery)
    RPC Functions (atomic multi-table writes)

──────────────────────────────────

      External Services

MSG91 (SMS — DLT-registered India SMS, MVP)
WhatsApp Provider (Phase 2)
Email (Phase 2)
```

---

# Technology Stack

## Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand

---

## Backend

Supabase

Including:

- PostgreSQL
- Authentication
- Storage
- Edge Functions
- Realtime
- Row Level Security

---

## Database

PostgreSQL

Managed by Supabase.

---

## Authentication

Supabase Auth

Phone Number

↓

OTP

↓

JWT Session

---

## File Storage

Supabase Storage

Used for:

- Business Logo

Future:

- Product Images
- Documents

---

## Notifications

MVP

SMS

Future

WhatsApp

Email

---

# Core Components

## Frontend

Responsible for:

- UI
- Navigation
- Forms
- Validation
- API Calls
- Offline UI States

Never contains business logic.

---

## Authentication

Responsibilities

- Login
- Session
- OTP
- Token Refresh

---

## Business Service

Responsible for:

- Business Profile
- Reward Rules
- Settings

---

## Staff Service

> **Phase 2 — NOT built in MVP.** Staff Management (invite, approve, suspend, remove) is excluded from MVP per Founder Decision 24. This service is listed here for architectural awareness only.

Phase 2 responsibilities:

- Staff Invitations
- Role Permissions
- Staff Access Control

---

## Customer Service

Responsible for:

- Search
- Create
- Customer History

---

## Catalog Service

Responsible for:

- Services (MVP)
- Pricing
- Status (Active / Inactive)

Not responsible for:

- Products (Phase 2 per Founder Decision 24)

---

## Billing Service

Responsible for:

- Billing session (cart management in Zustand)
- Subtotal calculation (client-side display, paise INTEGER)
- Reward calculation (server-validated via RPC)

Not responsible for:

- Taxes (not in MVP per Founder Decision 24)
- Split payments (not in MVP)
- Invoices (not in MVP)

---

## Reward Service

Responsible for:

- Reward Calculation
- Wallet Update
- Ledger

---

## Transaction Service

Responsible for:

- Transaction Storage
- History
- Search

---

## Notification Service

Responsible for:

- OTP
- Transaction SMS
- Future WhatsApp

---

## Audit Service

Responsible for:

- Internal Logs
- Debug History

---

# Request Flow

Example:

Customer Visit

↓

Next.js

↓

Authentication

↓

Customer Search

↓

Billing

↓

Reward Engine

↓

Transaction

↓

Notification

↓

Dashboard

---

# Architectural Principles

## Single Responsibility

Each service has one purpose.

---

## Stateless Frontend

Business logic stays on the server.

---

## Secure by Default

Every request is authenticated.

---

## Business Isolation

Every business can access only its own data.

---

## API First

Frontend communicates through clearly defined APIs.

---

## Server Validation

Never trust client calculations.

Reward calculations are always verified on the backend.

---

# Multi-Tenant Strategy

RewardLoop is a multi-tenant SaaS.

Every record belongs to one business.

Example:

Business

↓

Customers

↓

Transactions

↓

Catalog

↓

Reward Wallet

↓

Staff

Data is isolated using:

business_id

---

# Security Layers

Layer 1

Authentication

↓

Layer 2

Authorization

↓

Layer 3

Row Level Security

↓

Layer 4

Server Validation

↓

Layer 5

Audit Logging

---

# Scalability

The architecture supports future additions without redesign.

Examples

- Multi Branch
- AI
- Marketing
- Membership
- Analytics
- Coupons

---

# Non-Goals

RewardLoop does not use:

- Microservices
- Kubernetes
- Event Bus
- Message Queue

MVP remains a modular monolith.

---

# System Principles

- Keep architecture simple.
- Scale only when necessary.
- Prefer convention over complexity.
- Separate business logic from UI.
- Build for maintainability.

---

# Document Status

✅ Approved

This document defines the overall system architecture for RewardLoop and serves as the foundation for the database, backend, API, frontend, deployment, and security documentation.

# 00_Project_Setup.md

> **Project:** RewardLoop
>
> **Version:** 1.1
>
> **Status:** 🔒 Execution Blueprint
>
> **Purpose:** Bridge between planning documents and codebase. Every AI coding tool and every developer must follow this document before writing a single line of code.
>
> **Depends on:** All planning documents (00–09)

---

# Table of Contents

1. Tech Stack
2. Repository Structure
3. Feature Module Standard
4. Architecture Principles
5. Coding Standards
6. Naming Conventions
7. State Management
8. Form Standard
9. API & Error Handling Standard
10. Component Rules
11. Logging Standard
12. Security Standard
13. Performance Rules
14. Testing Strategy
15. Git Workflow
16. Environment Configuration
17. PWA Configuration
18. AI Coding Guidelines
19. Code Review Checklist
20. Definition of Done
21. Project Principles

---

# 1. Tech Stack

## Core

| Layer      | Technology   | Version            | Purpose                                                   |
| ---------- | ------------ | ------------------ | --------------------------------------------------------- |
| Framework  | Next.js      | 15.x               | App Router, Server Actions, SSR                           |
| Language   | TypeScript   | 5.x                | Strict mode, full type safety                             |
| Runtime    | React        | 19.x               | UI rendering                                              |
| Styling    | Tailwind CSS | **3.x**            | Utility-first CSS (NOT v4 — shadcn/ui requires v3 syntax) |
| Components | shadcn/ui    | latest stable      | Base component library                                    |
| Icons      | Lucide React | latest stable      | Consistent iconography                                    |
| Font       | Inter        | 400, 500, 600, 700 | Typography                                                |

## State & Data

| Layer        | Technology      | Purpose                                  |
| ------------ | --------------- | ---------------------------------------- |
| Server State | TanStack Query  | Fetching, caching, synchronization       |
| Client State | Zustand         | Billing session, UI state, bottom sheets |
| Forms        | React Hook Form | Form state, validation, submission       |
| Validation   | Zod             | Schema validation (client + server)      |

## Backend

| Layer     | Technology              | Purpose                     |
| --------- | ----------------------- | --------------------------- |
| Database  | PostgreSQL              | Via Supabase                |
| Auth      | Supabase Auth           | Phone OTP, JWT sessions     |
| Storage   | Supabase Storage        | Business logo               |
| Functions | Supabase Edge Functions | Server-side business logic  |
| Security  | Row Level Security      | Multi-tenant data isolation |

## Infrastructure

| Layer       | Technology           | Purpose                      |
| ----------- | -------------------- | ---------------------------- |
| Hosting     | Vercel               | Deployment, edge network     |
| Platform    | PWA                  | Installable, offline-capable |
| PWA Library | @ducanh2912/next-pwa | latest                       | Compatible with Next.js 15 App Router         |
| SMS         | MSG91                | REST API                     | DLT-registered India SMS, OTP + notifications |
| Testing     | Vitest + Playwright  | Unit/Integration + E2E       |

---

# 1a. Local Development Setup

> **Every developer must complete this setup before writing any code.**

## Prerequisites

```bash
# Node.js 20+ required
node --version

# Install Supabase CLI (one-time)
npm install -g supabase
```

## Step 1 — Install dependencies

```bash
npm install
```

## Step 2 — Initialize Supabase (first-time only)

```bash
npx supabase init
# Creates: supabase/config.toml, supabase/migrations/, supabase/seed.sql
```

## Step 3 — Start local Supabase stack

```bash
npx supabase start
```

Output provides local credentials. Copy them exactly:

```
API URL:          http://localhost:54321
Studio URL:       http://localhost:54323
DB URL:           postgresql://postgres:postgres@localhost:54322/postgres
Anon key:         <local-anon-key>
Service role key: <local-service-role-key>
```

## Step 4 — Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with the values from Step 3:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
MSG91_AUTH_KEY=<test-key-or-leave-empty-for-local>
MSG91_OTP_TEMPLATE_ID=<template-id>
MSG91_TRANSACTION_TEMPLATE_ID=<template-id>
MSG91_SENDER_ID=RWDLOP
```

## Step 5 — Apply database migrations

```bash
npx supabase db push
# Applies all SQL files in supabase/migrations/ in order
```

## Step 6 — Generate TypeScript types

```bash
npx supabase gen types typescript --local > src/types/database.ts
```

Run this after every schema change. Commit `database.ts`. Never edit it manually.

## Step 7 — Seed dev data

```bash
npx supabase db reset
# Wipes DB + re-applies all migrations + runs supabase/seed.sql
```

## Step 8 — Start Next.js

```bash
npm run dev
# App: http://localhost:3000
# Supabase Studio: http://localhost:54323
```

---

## Phone OTP in Local Development

Supabase local does NOT send real SMS. Two options:

**Option A (Recommended) — Configure a test OTP in `supabase/config.toml`:**

```toml
[auth.sms]
enable_signup = true
enable_confirmations = true

[auth.sms.test_otp]
"+919999999999" = "123456"
```

The number `+919999999999` always logs in with OTP `123456`. Use this for all local testing.

**Option B — Check Studio logs.** Real OTP codes for all numbers appear at `http://localhost:54323` → Authentication → Logs.

> **Never use test OTP configs in production.**

---

## Supabase CLI Reference

```bash
npx supabase start                    # Start local stack
npx supabase stop                     # Stop local stack
npx supabase db push                  # Apply pending migrations
npx supabase db reset                 # Reset DB + re-seed
npx supabase migration new <name>     # Create new migration file
npx supabase gen types typescript --local > src/types/database.ts
npx supabase functions serve          # Run Edge Functions locally
npx supabase link --project-ref <id>  # Link to production project
npx supabase db push --linked         # Deploy migrations to production
```

---

# 2. Repository Structure

```text
RewardLoop/
├── Documents/            # Product, planning, and architectural documents
├── Development/          # Sprint plans and execution blueprints
├── public/               # Static assets (icons, manifest, service worker)
├── src/                  # Next.js application source code
├── supabase/             # Supabase migrations, edge functions, and seed data
├── tests/                # Unit, integration, and E2E tests
├── scripts/              # Utility scripts for CI/CD and deployment
├── .github/
│   └── workflows/        # GitHub Actions workflows
├── package.json          # Project dependencies and scripts
└── README.md             # Project overview and quick start
```

---

## Application Structure

```
rewardloop/
├── public/
│   ├── icons/                    # PWA icons (192, 512)
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── verify/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (onboarding)/         # Onboarding route group
│   │   │   ├── setup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (app)/                # Main app route group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── transactions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── visit/
│   │   │   │   └── page.tsx
│   │   │   ├── insights/
│   │   │   │   └── page.tsx
│   │   │   ├── more/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── catalog/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── rewards/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── business/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx        # App shell with BottomNav
│   │   │
│   │   ├── api/                  # Route handlers (only when needed)
│   │   ├── layout.tsx            # Root layout
│   │   ├── loading.tsx           # Root loading
│   │   ├── error.tsx             # Root error
│   │   ├── not-found.tsx         # 404
│   │   └── globals.css           # Tailwind + design tokens
│   │
│   ├── components/               # Shared UI components
│   │   └── ui/                   # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── bottom-sheet.tsx
│   │       ├── skeleton.tsx
│   │       ├── toast.tsx
│   │       ├── badge.tsx
│   │       ├── chip.tsx
│   │       ├── avatar.tsx
│   │       ├── empty-state.tsx
│   │       ├── otp-input.tsx
│   │       ├── app-bar.tsx
│   │       ├── bottom-navigation.tsx
│   │       ├── section-header.tsx
│   │       └── divider.tsx
│   │
│   ├── features/                 # Feature modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   │
│   │   ├── business/
│   │   │   ├── components/
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   │
│   │   ├── customer/
│   │   │   ├── components/
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   │
│   │   ├── catalog/
│   │   │   ├── components/
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   │
│   │   ├── billing/
│   │   │   ├── components/
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   ├── stores/
│   │   │   └── types/
│   │   │
│   │   ├── reward/
│   │   │   ├── components/
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   │
│   │   ├── transaction/
│   │   │   ├── components/
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   │
│   │   ├── insights/
│   │   │   ├── components/
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   │
│   │   └── settings/
│   │       ├── components/
│   │       ├── actions/
│   │       ├── hooks/
│   │       └── types/
│   │
│   ├── hooks/                    # Shared hooks
│   │   ├── use-debounce.ts
│   │   └── use-media-query.ts
│   │
│   ├── lib/                      # Core utilities
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser Supabase client
│   │   │   ├── server.ts         # Server Supabase client
│   │   │   └── middleware.ts     # Auth middleware
│   │   ├── api/
│   │   │   └── result.ts         # ActionResult type
│   │   └── utils.ts              # cn(), formatCurrency(), etc.
│   │
│   ├── stores/                   # Zustand stores (global)
│   │   └── billing-store.ts
│   │
│   ├── types/                    # Shared type definitions
│   │   ├── database.ts           # Supabase generated types
│   │   └── common.ts             # Shared enums, constants
│   │
│   └── constants/                # App-wide constants
│       ├── routes.ts
│       ├── config.ts
│       └── messages.ts
│
├── supabase/                     # Supabase project
│   ├── migrations/               # SQL migrations
│   ├── functions/                # Edge Functions
│   └── seed.sql                  # Development seed data
│
├── .env.local                    # Local env vars (git-ignored)
├── .env.example                  # Template
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── middleware.ts                 # Next.js middleware (auth guard)
├── components.json               # shadcn/ui config
└── package.json
```

---

## Folder Rules

| Folder                   | Rule                                                   |
| ------------------------ | ------------------------------------------------------ |
| `app/`                   | Route definitions only. No business logic.             |
| `features/`              | Feature-first modules. Each feature is independent.    |
| `features/*/components/` | Feature-specific UI. Never imported by other features. |
| `features/*/actions/`    | Server Actions. `"use server"` at top.                 |
| `features/*/hooks/`      | Feature-specific React hooks.                          |
| `features/*/schemas/`    | Zod schemas for this feature.                          |
| `features/*/types/`      | TypeScript types for this feature.                     |
| `components/ui/`         | Shared, reusable components only.                      |
| `lib/`                   | Framework wrappers, clients, pure utilities.           |
| `stores/`                | Zustand stores. Client state only.                     |
| `types/`                 | Shared types used across features.                     |
| `constants/`             | Enums, route paths, config values.                     |

## Cross-Feature Rule

> No feature directly imports another feature's internal files.
>
> If two features need to share logic, extract it to `lib/` or `hooks/`.
>
> If two features need to share types, extract to `types/`.

---

# 3. Feature Module Standard

Every feature inside `src/features` must follow the exact same structure.

```text
feature-name/
├── components/
├── actions/
├── hooks/
├── schemas/
├── stores/
├── services/
├── types/
├── utils/
├── constants/
└── index.ts
```

No feature may deviate from this structure.

---

# 4. Architecture Principles

- Business logic never lives inside React components.
- UI renders state only.
- Server Actions contain business rules.
- Database stores source of truth.
- Reuse existing components before creating new ones.
- Prefer composition over duplication.
- Single Source of Truth everywhere.

---

# 5. Coding Standards

## TypeScript

```jsonc
// tsconfig.json — strict mode
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false,
  },
}
```

- `any` is forbidden. Use `unknown` and narrow.
- All function parameters and return types must be typed.
- Prefer `interface` for object shapes, `type` for unions/intersections.
- Use `as const` for literal arrays and objects.

## React

- **Functional components only.** No class components.
- **Server Components by default.** Add `"use client"` only when the component uses hooks, event handlers, or browser APIs.
- **No inline styles.** Tailwind only.
- **No prop drilling beyond 2 levels.** Use composition or context.
- **Composition over inheritance.** Build complex components from simple ones.
- **No default exports** (except for `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` as required by Next.js).
- **Colocation:** Tests, stories, and utilities live next to the component they serve.

## Linting

- ESLint with `next/core-web-vitals` and `typescript` presets.
- Prettier for formatting.
- No warnings allowed in CI.

---

# 6. Naming Conventions

## Files & Folders

| Type           | Convention | Example                      |
| -------------- | ---------- | ---------------------------- |
| Folder         | kebab-case | `catalog/`, `billing-store/` |
| Component file | kebab-case | `customer-card.tsx`          |
| Action file    | kebab-case | `create-transaction.ts`      |
| Hook file      | kebab-case | `use-customer-search.ts`     |
| Schema file    | kebab-case | `transaction-schema.ts`      |
| Type file      | kebab-case | `transaction-types.ts`       |
| Utility file   | kebab-case | `format-currency.ts`         |
| Constant file  | kebab-case | `routes.ts`                  |

## Code

| Type             | Convention             | Example                            |
| ---------------- | ---------------------- | ---------------------------------- |
| Component        | PascalCase             | `CustomerCard`                     |
| Hook             | camelCase (use prefix) | `useCustomerSearch`                |
| Function         | camelCase              | `formatCurrency`                   |
| Variable         | camelCase              | `rewardBalance`                    |
| Constant         | UPPER_SNAKE_CASE       | `MAX_OTP_ATTEMPTS`                 |
| Type / Interface | PascalCase             | `Transaction`, `CustomerCardProps` |
| Enum             | PascalCase             | `PaymentMethod`                    |
| Enum value       | UPPER_SNAKE_CASE       | `PaymentMethod.CASH`               |
| Server Action    | camelCase              | `completeTransaction`              |
| Zustand Store    | camelCase (use prefix) | `useBillingStore`                  |
| CSS Variable     | kebab-case             | `--color-primary`                  |

## Database

| Type       | Convention          | Example                         |
| ---------- | ------------------- | ------------------------------- |
| Table      | snake_case (plural) | `transactions`, `catalog_items` |
| Column     | snake_case          | `business_id`, `created_at`     |
| Enum       | snake_case          | `payment_method`                |
| Index      | idx_table_column    | `idx_customers_business_phone`  |
| RLS Policy | policy_table_action | `policy_transactions_select`    |

---

# 7. State Management

## Three Layers

```
┌──────────────────────────────────────────┐
│         Server State (TanStack Query)    │
│  Fetching, caching, sync, pagination     │
│  Source of truth for all server data     │
├──────────────────────────────────────────┤
│         Client State (Zustand)           │
│  Billing session, UI toggles,           │
│  bottom sheets, search term             │
├──────────────────────────────────────────┤
│         Local State (useState)           │
│  Form inputs, hover, focus,             │
│  component-scoped ephemeral state       │
└──────────────────────────────────────────┘
```

## Rules

| State                         | Use                                                                                   | Do NOT Use                                      |
| ----------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Server State (TanStack Query) | Dashboard data, transactions, catalog, customer search, insights                      | For UI toggles or form inputs                   |
| Client State (Zustand)        | Billing session cart, selected customer, active bottom sheet, selected payment method | For server-fetched data (no duplication)        |
| Local State (useState)        | Input values, loading flags, local toggles                                            | For data needed by sibling or parent components |

## TanStack Query Keys

```typescript
// Standard query key factory
export const queryKeys = {
  dashboard: (businessId: string) => ["dashboard", businessId] as const,
  transactions: (businessId: string) => ["transactions", businessId] as const,
  transaction: (id: string) => ["transaction", id] as const,
  catalog: (businessId: string) => ["catalog", businessId] as const,
  customer: (businessId: string, phone: string) =>
    ["customer", businessId, phone] as const,
  insights: (businessId: string, period: string) =>
    ["insights", businessId, period] as const,
} as const;
```

## Zustand Store Example

```typescript
// stores/billing-store.ts
interface BillingState {
  customer: Customer | null;
  items: CartItem[];
  rewardUsed: number;
  paymentMethod: PaymentMethod | null;

  // Actions
  setCustomer: (customer: Customer) => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  setRewardUsed: (amount: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  reset: () => void;
}
```

---

# 8. Form Standard

Every form in RewardLoop uses:

```
React Hook Form + Zod
```

## Architecture

```
Zod Schema (shared)
        │
        ├── Client: React Hook Form resolver
        │
        └── Server: Server Action validation
```

## Rules

1. **One Zod schema per form.** Shared between client and server.
2. **Client validation improves UX.** Show inline errors instantly.
3. **Server validation is the source of truth.** Never trust client data.
4. **Schemas live in `features/*/schemas/`.** One file per domain concept.

## Example

```typescript
// features/auth/schemas/login-schema.ts
import { z } from "zod";

export const loginSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be 10 digits")
    .max(10, "Phone number must be 10 digits")
    .regex(/^\d+$/, "Only numbers allowed"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

```typescript
// features/auth/components/login-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '../schemas/login-schema';

export function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    const result = await loginWithOTP(data);
    // handle result
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* fields */}</form>;
}
```

---

# 9. API & Error Handling Standard

## Communication Pattern

```
Next.js UI  →  Server Action  →  Supabase
```

- **Prefer Server Actions** for mutations (create, update, delete).
- **Prefer Route Handlers** only for webhooks, external integrations, or streaming.
- **Prefer Server Components** for initial data fetching.
- **Use TanStack Query** for client-side data fetching when Server Components are not appropriate.

## ActionResult Type

Every Server Action returns a consistent result:

```typescript
// lib/api/result.ts
type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string; errors?: Record<string, string[]> };
```

## Server Action Template

```typescript
// features/billing/actions/complete-transaction.ts
"use server";

import { createServerClient } from "@/lib/supabase/server";
import { transactionSchema } from "../schemas/transaction-schema";
import type { ActionResult } from "@/lib/api/result";
import type { Transaction } from "../types";

export async function completeTransaction(
  input: unknown,
): Promise<ActionResult<Transaction>> {
  // 1. Validate input
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  // 2. Authenticate
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Authentication required" };
  }

  // 3. Execute business logic
  // 4. Return result

  return { success: true, data: transaction };
}
```

## Error Handling Standard

One universal API response format for all Server Actions.

**Success**

```json
{
  "success": true,
  "data": {}
}
```

**Failure**

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "errors": {}
}
```

- Every Server Action must return this format.
- Never throw raw errors to the UI.
- Always map technical errors to human-readable messages.
- Error codes from `08_API_Design.md` are used internally for logging.

## Error Code Reference

```typescript
// constants/error-codes.ts
export const ERROR_CODES = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  INVALID_OTP: "INVALID_OTP",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  CUSTOMER_NOT_FOUND: "CUSTOMER_NOT_FOUND",
  REWARD_LIMIT_EXCEEDED: "REWARD_LIMIT_EXCEEDED",
  INSUFFICIENT_REWARD: "INSUFFICIENT_REWARD",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  SERVER_ERROR: "SERVER_ERROR",
} as const;
```

---

# 10. Component Rules

## Source

- **Base components:** shadcn/ui (never modified directly).
- **Business components:** Composed from base components inside `features/*/components/`.
- **Shared components:** Live in `components/ui/`.

## From UI Specification (09_UI_UX_Specification.md)

### Primitives (shadcn/ui based)

| Component    | Height | Radius    | Notes                                                |
| ------------ | ------ | --------- | ---------------------------------------------------- |
| Button       | 48px   | 12px      | Disabled until valid, loading spinner replaces label |
| Input        | 48px   | 12px      | Auto focus, inline validation                        |
| Card         | —      | 12px–16px | Level 1 shadow                                       |
| Dialog       | —      | 16px      | Destructive actions only                             |
| Bottom Sheet | —      | 20px top  | Max 90% height, swipe to close, backdrop dismiss     |
| Toast        | —      | 12px      | Success feedback                                     |

### Business Components (from Section 10)

| Component            | Feature              | Purpose                     |
| -------------------- | -------------------- | --------------------------- |
| CustomerCard         | customer             | Customer info in visit flow |
| CatalogItemCard      | catalog              | Service/product selection   |
| SelectedItemCard     | billing              | Selected items in cart      |
| TransactionCard      | transaction          | Transaction list item       |
| RewardSummaryCard    | reward               | Reward balance display      |
| WalletCard           | reward               | Customer wallet info        |
| StatCard             | dashboard / insights | Metric display              |
| PaymentMethodCard    | billing              | Cash / Online selection     |
| BillingSummaryCard   | billing              | Final bill summary          |
| ServiceSelectionCard | billing              | Service picker              |

### Component Rules

1. Never modify base shadcn/ui components directly.
2. Build business components by composition.
3. Every interactive element must have a minimum 48×48px touch target.
4. One primary action per screen.
5. Primary CTA always bottom-aligned, sticky, full-width.
6. Use Skeleton loading, not full-screen spinners.
7. All components must respect the design tokens from `09_UI_UX_Specification.md`.

---

# 11. Logging Standard

**Development**

`console.log` allowed.

**Production**

Never use `console.log`.

Use a centralized Logger utility.

**Log levels**

- Info
- Warn
- Error
- Audit

---

# 12. Security Standard

- Never trust client input.
- Validate everything with Zod.
- Server recalculates all reward values.
- Never expose service role keys.
- RLS enabled on every table.
- OTP expiration enforced.
- OTP attempt limit enforced.
- Rate limiting for OTP endpoints.
- Secrets never exposed to browser.

---

# 13. Performance Rules

- Server Components by default.
- Lazy load heavy modules.
- Dynamic imports where appropriate.
- Images optimized.
- Skeleton loading preferred.
- Avoid unnecessary re-renders.
- Keep bundle size minimal.

---

# 14. Testing Strategy

## Test Frameworks (Locked)

| Layer              | Framework      | Config File            | Location                     |
| ------------------ | -------------- | ---------------------- | ---------------------------- |
| Unit & Integration | **Vitest**     | `vitest.config.ts`     | `src/**/__tests__/*.test.ts` |
| E2E                | **Playwright** | `playwright.config.ts` | `e2e/*.spec.ts`              |

## Test Directory Structure

```
src/
├── lib/billing/__tests__/
│   └── billing-math.test.ts     ← 100% coverage REQUIRED
├── features/auth/__tests__/
├── features/billing/__tests__/
└── features/reward/__tests__/

e2e/
├── auth.spec.ts
├── onboarding.spec.ts
├── billing-no-reward.spec.ts
├── billing-with-reward.spec.ts
└── transactions.spec.ts
```

## Priority Test Targets

- `billing-math.ts` — 100% unit test coverage required before any billing sprint merges
- All Zod schemas — test valid + invalid inputs
- All Server Actions — integration tests with local Supabase
- Billing flow E2E — no-reward and with-reward paths

## Per-Sprint Requirements

Every sprint must include:

- [ ] Build passes
- [ ] TypeScript (`npx tsc --noEmit`) passes
- [ ] ESLint passes (0 warnings)
- [ ] Vitest unit tests pass
- [ ] Acceptance criteria from sprint doc verified
- [ ] Manual mobile testing (Chrome Android / Safari iOS)

---

# 15. Git Workflow

## Branches

```
main                    ← Production (Vercel auto-deploys)
  │
  └── develop           ← Integration branch
        │
        ├── feature/*   ← New features
        ├── fix/*       ← Bug fixes
        └── chore/*     ← Config, tooling, dependencies
```

## Branch Naming

```
feature/01-authentication
feature/02-onboarding
feature/03-dashboard
feature/04-add-visit
feature/05-transactions
feature/06-insights
feature/07-more-settings
fix/otp-validation
chore/update-dependencies
```

## Commit Convention

```
type(scope): description

feat(auth): add phone OTP login
fix(billing): correct reward calculation
chore(deps): update supabase-js
refactor(customer): extract search hook
```

## Rules

- Never push directly to `main`.
- `develop` is the integration branch.
- Feature branches are created from `develop`.
- Every merge requires a passing build and lint.
- Keep commits small and atomic.

---

# 16. Environment Configuration

## Variables

```bash
# .env.example

# App
NEXT_PUBLIC_APP_NAME=RewardLoop
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# SMS Provider (MSG91 — DLT-registered India SMS)
MSG91_AUTH_KEY=
MSG91_OTP_TEMPLATE_ID=
MSG91_TRANSACTION_TEMPLATE_ID=
MSG91_SENDER_ID=RWDLOP

# WhatsApp (Phase 2 — not configured in MVP)
# WHATSAPP_API_KEY=
```

## Rules

- `NEXT_PUBLIC_*` variables are exposed to the browser. Only use for non-secret values.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only**. Never import in client components.
- `.env.local` is git-ignored. `.env.example` is committed as a template.

---

# 17. PWA Configuration

## manifest.json

```json
{
  "name": "RewardLoop",
  "short_name": "RewardLoop",
  "description": "Digital loyalty and billing for local businesses",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#F8FAFC",
  "theme_color": "#4F46E5",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Install Prompt

From `00_Founder_Decisions.md` Decision 22:

> Show Install Prompt only after **3 completed visits**.
> Never on first launch.

**Tracking implementation:** The visit count is tracked server-side in `users.completed_visits_count` (or derived from `transactions COUNT`). Do NOT track in localStorage — it resets on browser data clear. Fetch the count from the server on each dashboard load to determine prompt eligibility.

---

# 18. AI Coding Guidelines

Every AI generated code must:

- Compile successfully.
- Pass TypeScript.
- Pass ESLint.
- Follow PRD.
- Follow Founder Decisions.
- Follow UI Specification.
- Reuse existing components.
- Never invent features.
- Never duplicate logic.
- Never change business rules without documentation.
- Always use existing design tokens.

---

# 19. Code Review Checklist

Before merging every feature verify:

- [ ] Build passes
- [ ] TypeScript passes
- [ ] ESLint passes
- [ ] No duplicated code
- [ ] No hardcoded strings
- [ ] No inline styles
- [ ] Responsive
- [ ] Accessible
- [ ] Business rules correct
- [ ] Security validated
- [ ] PRD compliant
- [ ] Founder Decisions compliant

---

# 20. Definition of Done

Every feature is complete only when ALL of the following pass:

## Build

- [ ] `npm run build` — no errors
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npm run lint` — no warnings

## Functionality

- [ ] All acceptance criteria from the sprint document are met
- [ ] Server-side validation works correctly
- [ ] Error states display correctly
- [ ] Empty states display correctly
- [ ] Loading states display correctly

## UI / UX

- [ ] Matches `09_UI_UX_Specification.md` design tokens
- [ ] All touch targets ≥ 48×48px
- [ ] Responsive on 360px–430px viewports
- [ ] One primary CTA per screen
- [ ] Bottom-aligned sticky CTA where specified
- [ ] Skeleton loading (no full-screen spinners)

## Accessibility

- [ ] WCAG AA contrast ratios
- [ ] Semantic HTML
- [ ] `aria-label` on icon-only buttons
- [ ] Visible focus states
- [ ] Respects `prefers-reduced-motion`

## Security

- [ ] Server validates all inputs (Zod)
- [ ] Server validates reward calculations
- [ ] RLS policies enforce `business_id` isolation
- [ ] No secret keys exposed to client

## PRD Compliance

- [ ] Feature matches `03_Product_PRD.md` requirements
- [ ] Feature matches `00_Founder_Decisions.md` decisions
- [ ] No out-of-scope features added

---

# Design Token Mapping

The following design tokens from `09_UI_UX_Specification.md` must be mapped into `tailwind.config.ts`:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          dark: "#3525CD",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        border: "#E5E7EB",
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["32px", "40px"],
        h1: ["28px", "36px"],
        h2: ["24px", "32px"],
        h3: ["20px", "28px"],
        "body-lg": ["18px", "28px"],
        body: ["16px", "24px"],
        label: ["14px", "20px"],
        caption: ["12px", "16px"],
        tiny: ["11px", "14px"],
      },
      spacing: {
        "space-1": "4px",
        "space-2": "8px",
        "space-3": "12px",
        "space-4": "16px",
        "space-6": "24px",
        "space-8": "32px",
        "space-12": "48px",
        "space-16": "64px",
      },
      boxShadow: {
        "level-1": "0px 1px 3px rgba(0, 0, 0, 0.1)",
        "level-2": "0px 10px 15px -3px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

# Sprint Sequence

This document is Sprint 0. The following sprints build on this foundation:

```
Sprint 0  →  00_Project_Setup.md          ← You are here
Sprint 1  →  01_Authentication.md
Sprint 2  →  02_Onboarding.md
Sprint 3  →  03_Dashboard.md
Sprint 4  →  04_Add_Visit.md
Sprint 0  →  00_Project_Setup.md       (Project scaffolding, DB migrations, env)
Sprint 1  →  01_Authentication.md      (Login, OTP, session management)
Sprint 2  →  02_Onboarding.md           (Business setup, reward rules, catalog)
Sprint 3  →  03_Dashboard.md            (Dashboard, home screen)
Sprint 4  →  04.1_Customer_Selection.md (Visit flow step 1: customer)
          →  04.2_Billing_Engine.md     (Visit flow step 2: billing math)
          →  04.3_Catalog_Selection.md  (Visit flow step 3: catalog)
          →  04.4_Reward_Redemption.md  (Visit flow step 4: reward OTP)
          →  04.5_Complete_Visit.md     (Visit flow step 5: checkout)
Sprint 5  →  05_Transactions.md         (Transaction list + detail + edit)
Sprint 6  →  06_Insights.md             (Today's insights: revenue, customers, rewards)
Sprint 7  →  07_More_Settings.md        (More screen, settings, catalog management)
Sprint 8  →  08_PWA_Offline.md          (PWA install prompt, service worker, offline)
Sprint 9  →  09_Testing_Release.md      (Testing, QA, release checklist)
```

Each sprint document follows this format:

```
Goal
Pages
Components
Database (migrations)
Server Actions
Validation (Zod schemas)
Edge Cases
Tasks
Acceptance Criteria
```

---

# Quick Reference

## Commands

```bash
# Development
npm run dev                     # Start dev server
npm run build                   # Production build
npm run lint                    # Lint check
npx tsc --noEmit                # Type check

# Supabase
npx supabase start              # Local Supabase
npx supabase db push            # Push migrations
npx supabase gen types          # Generate TypeScript types

# shadcn/ui
npx shadcn@latest add button    # Add a component
```

## Key Files

| File                      | Purpose                 |
| ------------------------- | ----------------------- |
| `tailwind.config.ts`      | Design tokens           |
| `middleware.ts`           | Auth guard              |
| `lib/supabase/client.ts`  | Browser Supabase client |
| `lib/supabase/server.ts`  | Server Supabase client  |
| `lib/api/result.ts`       | ActionResult type       |
| `stores/billing-store.ts` | Billing session state   |
| `constants/routes.ts`     | Route path constants    |

---

# 21. Project Principles

**RewardLoop Engineering Principles**

1. Simplicity over cleverness.
2. Consistency over shortcuts.
3. Reuse before creating.
4. Performance by default.
5. Mobile-first always.
6. Security by default.
7. Accessibility by default.
8. Documentation first.
9. Business rules are the source of truth.
10. Build for long-term maintainability.

---

# Document Status

✅ Approved

🔒 Locked

This document is the execution bridge between the 10 planning documents and the RewardLoop codebase. Every developer and every AI coding tool must follow this document as the single source of truth for project setup, coding standards, and engineering conventions.

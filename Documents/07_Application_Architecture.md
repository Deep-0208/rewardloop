# 07_Application_Architecture.md

> **Project:** RewardLoop
> **Version:** 2.0
> **Status:** ✅ Approved — Implementation Ready
> **Purpose:** Define the complete application architecture including technology stack, server action vs. RPC vs. edge function responsibilities, routing architecture, state management configuration, TypeScript interface catalog, caching strategy, and AI coding boundaries.

---

# Table of Contents

1. Architecture Philosophy
2. Technology Stack (Locked Versions)
3. Runtime Boundary: Who Does What
4. Routing Architecture
5. Project Folder Structure
6. Feature Module Structure
7. State Management Configuration
8. TanStack Query Configuration (Per Query)
9. Zustand Store Catalog
10. TypeScript Interface Catalog
11. Supabase RPC Functions
12. Server Action Template
13. ActionResult Type
14. Notification Pipeline
15. Single-Device Session Enforcement
16. Caching Strategy
17. Error Handling Standards
18. Coding Standards
19. Testing Strategy
20. Performance Principles
21. Security Principles

---

# 1. Architecture Philosophy

RewardLoop is a **modular monolith** — all application code lives in one Next.js repository. It is NOT microservices.

Every module is independent and can be developed, tested, and deployed independently, but all share the same runtime.

- **No distributed systems in MVP.**
- **No separate backend service.**
- **One Supabase project per environment.**
- **One Vercel deployment.**

---

# 2. Technology Stack (Locked Versions)

| Layer             | Technology             | Version           | Notes                                 |
| ----------------- | ---------------------- | ----------------- | ------------------------------------- |
| Framework         | Next.js                | 15.x (App Router) | Server Components by default          |
| Language          | TypeScript             | 5.x               | Strict mode                           |
| Styling           | Tailwind CSS           | **4.x**           | v4 syntax (`@theme`)                  |
| Component Library | shadcn/ui              | Latest stable     | Installed per component via CLI       |
| Server State      | TanStack Query         | 5.x               | `@tanstack/react-query`               |
| Client State      | Zustand                | 4.x               |                                       |
| Form State        | React Hook Form        | 7.x               |                                       |
| Validation        | Zod                    | 3.x               | Server and client                     |
| Database Client   | supabase-js            | 2.x               | `@supabase/supabase-js`               |
| Auth              | Supabase Auth          | Via supabase-js   | Phone OTP                             |
| Icons             | Lucide React           | Latest stable     |                                       |
| PWA               | `@ducanh2912/next-pwa` | Latest            | Compatible with Next.js 15 App Router |
| SMS               | MSG91                  | REST API          | DLT-registered India SMS              |
| Unit Tests        | Vitest                 | Latest            |                                       |
| E2E Tests         | Playwright             | Latest            |                                       |
| Deployment        | Vercel                 | —                 |                                       |
| Database          | Supabase PostgreSQL    | —                 |                                       |

> **IMPORTANT on Tailwind:** Use Tailwind v4 configuration syntax (`@theme`).

---

# 3. Runtime Boundary: Who Does What

This table defines which runtime handles which operation. **No operation may run in the wrong runtime.**

## 3.1 Next.js Server Actions

Used for: Business logic operations that require a database write or sensitive read.

| Operation            | Server Action          | Notes                 |
| -------------------- | ---------------------- | --------------------- |
| Create business      | `createBusiness()`     | Onboarding            |
| Save reward rules    | `saveRewardRules()`    | Onboarding + Settings |
| Create catalog items | `createCatalogItems()` | Onboarding + Settings |
| Search customer      | `searchCustomer()`     | Visit flow            |
| Get catalog          | `getCatalog()`         | Visit flow            |
| Get reward rules     | `getRewardRules()`     | Billing               |
| Get dashboard data   | `getDashboard()`       | Dashboard             |
| Get insights         | `getInsights()`        | Insights (today only) |
| Get transactions     | `getTransactions()`    | Transactions          |
| Get transaction      | `getTransaction()`     | Transaction detail    |
| Update transaction   | `updateTransaction()`  | 5-min edit window     |
| Update business      | `updateBusiness()`     | Settings              |
| Update catalog item  | `updateCatalogItem()`  | Settings              |
| Logout               | `logout()`             | Auth                  |
| Get business         | `getBusiness()`        | Settings              |

## 3.2 Supabase RPC Functions (PostgreSQL)

Used for: Multi-table atomic writes that require BEGIN/COMMIT transaction semantics.

> **CRITICAL:** `supabase-js` does NOT support `BEGIN/COMMIT` blocks directly from the application layer. All multi-table atomic writes MUST use Supabase RPC functions (PostgreSQL functions called via `supabase.rpc()`).

| RPC Function                                                   | Purpose                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `complete_visit(payload)`                                      | Atomically saves transaction + items + ledger + wallet + customer stats. The grand finale. |
| `auto_create_customer(business_id, phone)`                     | Creates customer + wallet atomically if not found.                                         |
| `update_reward_rules(business_id, reward_pct, max_redeem_pct)` | Updates reward_rules and logs to audit_logs.                                               |
| `increment_session_version(p_user_id)`                         | Atomically increments the `session_version` for single-device isolation.                   |
| `check_and_update_otp_cooldown(p_phone)`                       | Enforces a 30-second cooldown on OTP requests to prevent abuse.                            |

See the full RPC function signatures in Section 11.

## 3.3 Supabase Edge Functions

Used for: Operations that must run close to the SMS provider or need to be triggered asynchronously.

| Edge Function          | Purpose                                                                      | Trigger                                         |
| ---------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| `send-otp`             | Calls MSG91 API to deliver OTP SMS. Stores request in `otp_requests`.        | Called from `sendRewardOTP()` Server Action     |
| `send-transaction-sms` | Sends transaction confirmation SMS via MSG91.                                | Called fire-and-forget after `complete_visit()` |
| `verify-otp`           | Verifies OTP hash against `otp_requests` table. Returns a short-lived token. | Called from reward redemption Server Action     |

> **Why Edge Functions for SMS?** MSG91 API calls should not block the main Server Action response path. Edge Functions allow the SMS to be sent close to the user with low latency.

## 3.4 Client Components Only

These operations happen client-side:

| Operation             | Runtime                      | State             |
| --------------------- | ---------------------------- | ----------------- |
| Billing math display  | Zustand derived state        | `useBillingStore` |
| OTP input auto-submit | React component              | Local state       |
| Search debounce       | TanStack Query + React state | —                 |
| Cart management       | Zustand                      | `useBillingStore` |
| PWA install prompt    | React hook                   | `usePWAStore`     |
| Offline detection     | Browser API                  | `usePWAStore`     |

---

# 4. Routing Architecture

## 4.1 Route Groups

```
app/
├── (auth)/                  — Auth pages (no bottom nav)
│   ├── login/
│   │   └── page.tsx         — Phone number entry
│   └── verify/
│       └── page.tsx         — OTP verification
│
├── (onboarding)/            — Onboarding pages (no bottom nav)
│   ├── business/
│   │   └── page.tsx         — Step 1: Business setup
│   ├── rewards/
│   │   └── page.tsx         — Step 2: Reward rules
│   └── catalog/
│       └── page.tsx         — Step 3: Catalog setup
│
└── (app)/                   — Main app pages (with bottom nav)
    ├── dashboard/
    │   └── page.tsx         — Home dashboard
    ├── transactions/
    │   ├── page.tsx         — Transaction list
    │   └── [id]/
    │       └── page.tsx     — Transaction detail
    ├── insights/
    │   └── page.tsx         — Insights (today only)
    ├── more/
    │   └── page.tsx         — More / Settings hub
    │   ├── catalog/
    │   │   └── page.tsx     — Catalog management
    │   ├── rewards/
    │   │   └── page.tsx     — Reward rules settings
    │   └── business/
    │       └── page.tsx     — Business profile settings
    └── visit/               — Add Visit multi-step flow (NO bottom nav during flow)
        └── page.tsx         — Single page with internal step state machine
```

## 4.2 Visit Flow Routing Decision

> **DECISION:** The Add Visit workflow (Customer Selection → Catalog → Reward → Payment) is implemented as a **single-page multi-step wizard** on `/visit`, NOT as multiple routes.
>
> **Reason:** Sharing Zustand billing state across routes requires URL-based state persistence (complex) or session storage. A single-page wizard shares Zustand state in memory naturally.
>
> **Implementation:** `useBillingStore` drives the step UI. Steps: `customer_selection | catalog | reward | checkout`. The URL remains `/visit` throughout.
>
> **Back navigation:** Managed by `useBillingStore.setStep(previousStep)`. Browser back button is intercepted to navigate steps instead of leaving `/visit`.

## 4.3 Middleware (Route Protection)

```typescript
// middleware.ts
// Protects all (app)/* and (onboarding)/* routes.
// Enforces single-device sessions natively at the Edge.
// 1. Validates the Supabase session via NEXT_PUBLIC_SUPABASE_ANON_KEY.
// 2. Verifies the `rl_sv` HMAC-signed cookie using the shared `session-validator.ts`.
// 3. Queries `public.users.session_version` to enforce strict device isolation.
// Redirects to /login if unauthenticated, suspended, or session revoked.
// Redirects to /dashboard if authenticated and accessing /login or /verify.
```

---

# 5. Project Folder Structure

```
c:\Users\DELL\Desktop\RewardLoop\
├── Documents/           — Planning documents (read-only during development)
├── Development/         — Sprint specification documents
└── src/                 — Application source code (future repo)
    ├── app/
    │   ├── (auth)/
    │   ├── (onboarding)/
    │   ├── (app)/
    │   ├── layout.tsx
    │   ├── globals.css
    │   └── manifest.ts
    ├── features/
    │   ├── auth/
    │   ├── onboarding/
    │   ├── customer/
    │   ├── catalog/
    │   ├── billing/
    │   ├── reward/
    │   ├── checkout/
    │   ├── transactions/
    │   ├── dashboard/
    │   ├── insights/
    │   ├── settings/
    │   ├── pwa/
    │   └── notifications/
    │   — NOTE: No features/staff/ folder until Phase 2 Staff Management is specified.
    ├── components/
    │   └── ui/          — shadcn/ui components + shared RewardLoop components
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts    — Browser Supabase client
    │   │   └── server.ts    — Server Supabase client (Server Actions)
    │   ├── api/
    │   │   └── result.ts    — ActionResult<T> type
    │   └── billing/
    │       └── billing-math.ts   — Pure billing calculation functions (paise)
    ├── stores/
    │   ├── billing-store.ts
    │   └── pwa-store.ts
    ├── hooks/
    │   └── use-network-status.ts
    ├── types/
    │   └── database.ts      — Supabase-generated types (run: npx supabase gen types)
    ├── constants/
    │   └── routes.ts
    ├── validations/         — Zod schemas
    │   ├── auth-schema.ts
    │   ├── billing-schema.ts
    │   ├── catalog-schema.ts
    │   └── transaction-schema.ts
    └── middleware.ts
```

---

# 6. Feature Module Structure

Every feature follows the same internal structure:

```
features/[feature-name]/
├── components/          — React components for this feature
├── actions/             — Next.js Server Actions for this feature
├── hooks/               — TanStack Query hooks for this feature
├── types/               — TypeScript interfaces specific to this feature
└── schemas/             — Zod validation schemas for this feature
```

**Rule:** No feature directly imports from another feature's internals. Cross-feature communication happens through shared `types/`, `lib/`, or `stores/`.

---

# 7. State Management Configuration

## Three-Layer Rule

| Layer                | Library        | Use For                                   | Never Use For            |
| -------------------- | -------------- | ----------------------------------------- | ------------------------ |
| Server State         | TanStack Query | DB data, async fetches                    | Billing math, UI toggles |
| Client/Session State | Zustand        | Billing session, billing step, OTP token  | DB data duplicates       |
| Local State          | React useState | Form inputs, open/close, single component | Shared data              |

---

# 8. TanStack Query Configuration (Per Query)

> All TanStack Query settings are defined here as the single source of truth.

```typescript
// Global defaults (QueryClient config)
{
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes default
      gcTime: 10 * 60 * 1000,     // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    }
  }
}
```

## Per-Query Configuration

| Query Key                               | staleTime | gcTime | refetchOnWindowFocus | Notes                             |
| --------------------------------------- | --------- | ------ | -------------------- | --------------------------------- |
| `['dashboard', businessId]`             | 30s       | 5min   | true                 | Dashboard refreshes on focus      |
| `['transactions', businessId, filters]` | 2min      | 10min  | false                |                                   |
| `['transaction', id]`                   | 5min      | 10min  | false                |                                   |
| `['catalog', businessId]`               | 5min      | 10min  | false                |                                   |
| `['rewardRules', businessId]`           | 5min      | 10min  | false                |                                   |
| `['customer', phone, businessId]`       | 0         | 1min   | false                | Always fresh for billing          |
| `['wallet', customerId, businessId]`    | 0         | 0      | false                | **ALWAYS fresh** — financial data |
| `['insights', businessId]`              | 30s       | 5min   | true                 |                                   |
| `['business', businessId]`              | 10min     | 30min  | false                |                                   |

---

# 9. Zustand Store Catalog

## `useBillingStore`

```typescript
// stores/billing-store.ts
interface CartItem {
  catalogItemId: string;
  name: string;
  unitPrice: number; // In paise
  quantity: number;
  totalPrice: number; // In paise = unitPrice * quantity
}

interface BillingState {
  // Step management
  step: "customer_selection" | "catalog" | "reward" | "checkout";
  setStep: (step: BillingState["step"]) => void;

  // Customer
  customer: CustomerSummary | null;
  setCustomer: (customer: CustomerSummary | null) => void;

  // Cart
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (catalogItemId: string) => void;
  updateQuantity: (catalogItemId: string, quantity: number) => void;

  // Computed (client-side, display only — server recalculates at save)
  subtotal: number; // paise
  maxRedeem: number; // paise — set from server data (wallet + rules)
  rewardApplied: number; // paise
  finalAmount: number; // paise
  rewardEarned: number; // paise

  // Reward / OTP
  rewardApplied: number; // paise
  setRewardApplied: (amount: number) => void;
  otpVerifiedToken: string | null; // Short-lived token from verifyOTP Edge Function
  setOtpVerifiedToken: (token: string | null) => void;

  // Payment
  paymentMethod: "cash" | "online" | "none";
  setPaymentMethod: (method: BillingState["paymentMethod"]) => void;

  // Idempotency
  idempotencyKey: string; // Set on mount of /visit page, cleared on reset

  // Reset (called after successful completeVisit)
  reset: () => void;
}
```

## `usePWAStore`

```typescript
// stores/pwa-store.ts
interface PWAState {
  isOffline: boolean;
  setIsOffline: (value: boolean) => void;
  isInstallable: boolean;
  setIsInstallable: (value: boolean) => void;
  updateAvailable: boolean;
  setUpdateAvailable: (value: boolean) => void;
  completedVisitsCount: number; // From DB — determines install prompt eligibility
}
```

---

# 10. TypeScript Interface Catalog

> These are the canonical interfaces for all domain entities. All Server Actions, components, and hooks must use these exact interfaces.

```typescript
// types/domain.ts

/** E.164 phone number string: "+91XXXXXXXXXX" */
type PhoneNumber = string;

/** UUID string */
type UUID = string;

/** Monetary value in paise (integer). 1 INR = 100 paise. */
type Paise = number;

/** ISO 8601 timestamp string */
type Timestamp = string;

// ─── Business ─────────────────────────────────────────────────────────────

interface Business {
  id: UUID;
  name: string;
  businessType:
    "salon" | "spa" | "gym" | "cafe" | "clinic" | "car_wash" | "other";
  logoUrl: string | null;
  gstNumber: string | null;
  address: string | null;
  email: string | null;
  status: "active" | "suspended" | "deleted";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Reward Rules ─────────────────────────────────────────────────────────

interface RewardRules {
  id: UUID;
  businessId: UUID;
  rewardPercentage: number; // Integer 1–50
  maxRedeemPercentage: number; // Integer 1–50
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── User ─────────────────────────────────────────────────────────────────

interface AppUser {
  id: UUID;
  businessId: UUID | null;
  authUserId: UUID;
  name: string | null;
  phone: PhoneNumber;
  role: "owner" | "staff";
  status: "active" | "suspended" | "removed";
  sessionVersion: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Customer ─────────────────────────────────────────────────────────────

interface Customer {
  id: UUID;
  businessId: UUID;
  phone: PhoneNumber;
  name: string | null;
  totalVisits: number;
  lastVisitAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Used in billing flow — lightweight customer summary */
interface CustomerSummary {
  id: UUID;
  phone: PhoneNumber;
  name: string | null;
  walletBalance: Paise; // From reward_wallets.current_balance
}

// ─── Catalog ──────────────────────────────────────────────────────────────

interface CatalogItem {
  id: UUID;
  catalogId: UUID;
  businessId: UUID;
  type: "service";
  name: string;
  price: Paise;
  status: "active" | "inactive";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Billing / Cart ───────────────────────────────────────────────────────

interface CartItem {
  catalogItemId: UUID;
  name: string;
  unitPrice: Paise;
  quantity: number;
  totalPrice: Paise; // = unitPrice * quantity
}

/** The complete billing calculation result — produced by billing-math.ts */
interface BillingResult {
  subtotal: Paise;
  maxRedeem: Paise;
  rewardApplied: Paise;
  finalAmount: Paise;
  rewardEarned: Paise;
}

// ─── Complete Visit (RPC Payload) ─────────────────────────────────────────

interface CompleteVisitPayload {
  idempotencyKey: UUID;
  businessId: UUID;
  customerId: UUID;
  createdBy: UUID;
  items: {
    catalogItemId: UUID;
    itemName: string;
    quantity: number;
    unitPrice: Paise;
    totalPrice: Paise;
  }[];
  rewardApplied: Paise;
  paymentMethod: "cash" | "online" | "none";
  otpVerifiedToken: string | null; // Required if rewardApplied > 0
}

interface CompleteVisitResult {
  transactionId: UUID;
  subtotal: Paise;
  rewardUsed: Paise;
  rewardEarned: Paise;
  finalPaid: Paise;
}

// ─── Transaction ──────────────────────────────────────────────────────────

interface Transaction {
  id: UUID;
  idempotencyKey: UUID;
  businessId: UUID;
  customerId: UUID;
  createdBy: UUID;
  subtotal: Paise;
  rewardUsed: Paise;
  rewardEarned: Paise;
  finalPaid: Paise;
  paymentMethod: "cash" | "online" | "none";
  rewardPercentageApplied: number;
  maxRedeemPercentageApplied: number;
  editedUntil: Timestamp;
  createdAt: Timestamp;
}

interface TransactionItem {
  id: UUID;
  transactionId: UUID;
  businessId: UUID;
  catalogItemId: UUID | null;
  itemName: string;
  quantity: number;
  unitPrice: Paise;
  totalPrice: Paise;
  createdAt: Timestamp;
}

/** Transaction with items and customer info — used in detail view */
interface TransactionDetail extends Transaction {
  items: TransactionItem[];
  customer: Pick<Customer, "id" | "name" | "phone">;
  auditLogs: AuditLogSummary[];
}

// ─── Reward Wallet ────────────────────────────────────────────────────────

interface RewardWallet {
  id: UUID;
  customerId: UUID;
  businessId: UUID;
  currentBalance: Paise;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Dashboard ────────────────────────────────────────────────────────────

interface DashboardData {
  todayRevenue: Paise;
  todayCustomerCount: number;
  recentTransactions: TransactionCard[];
}

interface TransactionCard {
  id: UUID;
  customerName: string | null;
  customerPhone: PhoneNumber;
  finalPaid: Paise;
  rewardUsed: Paise;
  paymentMethod: "cash" | "online" | "none";
  createdAt: Timestamp;
}

// ─── Insights ─────────────────────────────────────────────────────────────

/** Insights is Today only in MVP. Period param reserved for Phase 2. */
interface InsightsData {
  period: "today"; // Always 'today' in MVP
  revenue: Paise;
  customerCount: number;
  totalRewardsGiven: Paise;
}

// ─── Audit Log ────────────────────────────────────────────────────────────

interface AuditLogSummary {
  id: UUID;
  event: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: Timestamp;
}

// ─── ActionResult (Server Action return type) ─────────────────────────────

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode };

type ErrorCode =
  | "AUTH_REQUIRED"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED" // Single-device enforcement
  | "INVALID_OTP"
  | "OTP_EXPIRED"
  | "OTP_MAX_ATTEMPTS"
  | "RATE_LIMITED"
  | "CUSTOMER_NOT_FOUND"
  | "CUSTOMER_AUTO_CREATED" // Not an error — signal to UI
  | "BUSINESS_NOT_FOUND"
  | "CATALOG_ITEM_NOT_FOUND"
  | "REWARD_LIMIT_EXCEEDED"
  | "WALLET_INSUFFICIENT"
  | "VALIDATION_FAILED"
  | "DUPLICATE_TRANSACTION" // Idempotency key already used
  | "TRANSACTION_FAILED"
  | "EDIT_WINDOW_EXPIRED"
  | "EDIT_FIELD_NOT_ALLOWED"
  | "OFFLINE"
  | "SERVER_ERROR";
```

---

# 11. Supabase RPC Functions

These PostgreSQL functions are the ONLY way to perform multi-table atomic writes. They are called via `supabase.rpc('function_name', payload)` from Server Actions.

## 11.1 `complete_visit`

```sql
-- Called by the completeVisit Server Action.
-- This is the atomic grand finale. All-or-nothing.

CREATE OR REPLACE FUNCTION complete_visit(
  p_idempotency_key    UUID,
  p_business_id        UUID,
  p_customer_id        UUID,
  p_created_by         UUID,
  p_items              JSONB,   -- Array of {catalog_item_id, item_name, quantity, unit_price, total_price}
  p_reward_applied     INTEGER, -- In paise
  p_payment_method     TEXT,
  p_otp_token          TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id     UUID;
  v_subtotal           INTEGER := 0;
  v_reward_rules       reward_rules%ROWTYPE;
  v_wallet             reward_wallets%ROWTYPE;
  v_max_allowed        INTEGER;
  v_max_redeem         INTEGER;
  v_final_paid         INTEGER;
  v_reward_earned      INTEGER;
  v_item               JSONB;
  v_existing_key       idempotency_keys%ROWTYPE;
BEGIN
  -- Step 0: Check idempotency key
  SELECT * INTO v_existing_key
    FROM idempotency_keys
    WHERE key = p_idempotency_key
    FOR UPDATE;

  IF FOUND AND v_existing_key.transaction_id IS NOT NULL THEN
    -- Duplicate request — return cached result
    RETURN jsonb_build_object(
      'success', true,
      'transactionId', v_existing_key.transaction_id,
      'duplicate', true
    );
  END IF;

  -- Step 1: Insert idempotency key (if not exists)
  IF NOT FOUND THEN
    INSERT INTO idempotency_keys (key, business_id, customer_id)
    VALUES (p_idempotency_key, p_business_id, p_customer_id)
    ON CONFLICT (key) DO NOTHING;
  END IF;

  -- Step 2: Validate and lock wallet
  SELECT * INTO v_wallet
    FROM reward_wallets
    WHERE customer_id = p_customer_id
      AND business_id = p_business_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  -- Step 3: Get reward rules
  SELECT * INTO v_reward_rules
    FROM reward_rules
    WHERE business_id = p_business_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REWARD_RULES_NOT_FOUND';
  END IF;

  -- Step 4: Calculate subtotal from items (server-side, not trusting client)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := v_subtotal + ((v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER);
  END LOOP;

  -- Step 5: Server-side billing validation
  v_max_allowed := (v_subtotal * v_reward_rules.max_redeem_percentage) / 100;
  v_max_redeem  := LEAST(v_wallet.current_balance, v_max_allowed);

  IF p_reward_applied > v_max_redeem THEN
    RAISE EXCEPTION 'REWARD_LIMIT_EXCEEDED';
  END IF;

  IF p_reward_applied > v_wallet.current_balance THEN
    RAISE EXCEPTION 'WALLET_INSUFFICIENT';
  END IF;

  v_final_paid   := v_subtotal - p_reward_applied;
  v_reward_earned := (v_final_paid * v_reward_rules.reward_percentage) / 100;

  -- Step 6: Validate OTP token if reward applied
  IF p_reward_applied > 0 THEN
    IF p_otp_token IS NULL OR p_otp_token = '' THEN
      RAISE EXCEPTION 'OTP_REQUIRED';
    END IF;
    -- OTP token validation is pre-validated by the verifyOTP Edge Function.
    -- The token is a one-time use token stored in otp_requests.verified_at.
    -- Server Action validates this before calling RPC. RPC trusts pre-validated token.
  END IF;

  -- ─── BEGIN ATOMIC BLOCK ───────────────────────────────────────────────

  -- Step 7: Insert transaction
  INSERT INTO transactions (
    idempotency_key, business_id, customer_id, created_by,
    subtotal, reward_used, reward_earned, final_paid, payment_method,
    reward_percentage_applied, max_redeem_percentage_applied,
    edited_until
  ) VALUES (
    p_idempotency_key, p_business_id, p_customer_id, p_created_by,
    v_subtotal, p_reward_applied, v_reward_earned, v_final_paid, p_payment_method::payment_method_enum,
    v_reward_rules.reward_percentage, v_reward_rules.max_redeem_percentage,
    now() + INTERVAL '5 minutes'
  ) RETURNING id INTO v_transaction_id;

  -- Step 8: Insert transaction items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO transaction_items (
      transaction_id, business_id, catalog_item_id, item_name, quantity, unit_price, total_price
    ) VALUES (
      v_transaction_id,
      p_business_id,
      (v_item->>'catalog_item_id')::UUID,
      v_item->>'item_name',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::INTEGER,
      (v_item->>'total_price')::INTEGER
    );
  END LOOP;

  -- Step 9: Insert reward ledger entries
  IF p_reward_applied > 0 THEN
    INSERT INTO reward_ledger (wallet_id, business_id, transaction_id, type, amount, balance_after)
    VALUES (
      v_wallet.id, p_business_id, v_transaction_id,
      'redeemed', p_reward_applied,
      v_wallet.current_balance - p_reward_applied
    );
  END IF;

  IF v_reward_earned > 0 THEN
    INSERT INTO reward_ledger (wallet_id, business_id, transaction_id, type, amount, balance_after)
    VALUES (
      v_wallet.id, p_business_id, v_transaction_id,
      'earned', v_reward_earned,
      v_wallet.current_balance - p_reward_applied + v_reward_earned
    );
  END IF;

  -- Step 10: Update wallet balance
  UPDATE reward_wallets
    SET current_balance = current_balance - p_reward_applied + v_reward_earned,
        updated_at = now()
    WHERE id = v_wallet.id;

  -- Step 11: Update customer stats
  UPDATE customers
    SET total_visits = total_visits + 1,
        last_visit_at = now(),
        updated_at = now()
    WHERE id = p_customer_id;

  -- Step 12: Update idempotency key with transaction_id
  UPDATE idempotency_keys
    SET transaction_id = v_transaction_id
    WHERE key = p_idempotency_key;

  -- Step 13: Insert audit log
  INSERT INTO audit_logs (business_id, user_id, event, entity, entity_id, new_value)
  VALUES (
    p_business_id, p_created_by,
    'TRANSACTION_CREATED', 'transactions', v_transaction_id,
    jsonb_build_object('final_paid', v_final_paid, 'reward_used', p_reward_applied)
  );

  -- ─── END ATOMIC BLOCK ─────────────────────────────────────────────────

  RETURN jsonb_build_object(
    'success', true,
    'transactionId', v_transaction_id,
    'subtotal', v_subtotal,
    'rewardUsed', p_reward_applied,
    'rewardEarned', v_reward_earned,
    'finalPaid', v_final_paid,
    'duplicate', false
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction is automatically rolled back on exception.
    RAISE;
END;
$$;
```

## 11.2 `auto_create_customer`

```sql
CREATE OR REPLACE FUNCTION auto_create_customer(
  p_business_id  UUID,
  p_phone        TEXT,
  p_created_by   UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id  UUID;
  v_wallet_id    UUID;
BEGIN
  -- Insert customer (ignore conflict — phone already exists)
  INSERT INTO customers (business_id, phone, created_at, updated_at)
  VALUES (p_business_id, p_phone, now(), now())
  ON CONFLICT (business_id, phone) DO NOTHING
  RETURNING id INTO v_customer_id;

  -- If conflict occurred, fetch existing
  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id
    FROM customers
    WHERE business_id = p_business_id AND phone = p_phone;
  END IF;

  -- Create wallet if doesn't exist
  INSERT INTO reward_wallets (customer_id, business_id, current_balance)
  VALUES (v_customer_id, p_business_id, 0)
  ON CONFLICT (customer_id, business_id) DO NOTHING;

  RETURN jsonb_build_object('customerId', v_customer_id);
END;
$$;
```

## 11.3 `increment_session_version`

```sql
CREATE OR REPLACE FUNCTION public.increment_session_version(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.users
  SET session_version = session_version + 1,
      updated_at = now()
  WHERE auth_user_id = p_user_id;
END;
$function$
```

## 11.4 `check_and_update_otp_cooldown`

```sql
CREATE OR REPLACE FUNCTION public.check_and_update_otp_cooldown(p_phone text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_last_request timestamptz;
BEGIN
  SELECT created_at INTO v_last_request
  FROM public.otp_requests
  WHERE phone = p_phone
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_request IS NOT NULL AND (now() - v_last_request) < interval '30 seconds' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$function$
```

---

# 12. Server Action Template

```typescript
// Template: features/[feature]/actions/[action-name].ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { ActionResult } from "@/types/domain";

// 1. Define Zod schema
const MyActionSchema = z.object({
  businessId: z.string().uuid(),
  // ... additional fields
});

type MyActionInput = z.infer<typeof MyActionSchema>;

export async function myAction(
  input: MyActionInput,
): Promise<ActionResult<{ result: string }>> {
  // 2. Validate input
  const parsed = MyActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input.",
      code: "VALIDATION_FAILED",
    };
  }

  // 3. Get Supabase client and verify session
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      success: false,
      error: "Authentication required.",
      code: "AUTH_REQUIRED",
    };
  }

  // 4. Verify session_version (single-device enforcement)
  const { data: appUser } = await supabase
    .from("users")
    .select("id, business_id, session_version")
    .eq("auth_user_id", user.id)
    .single();

  // Note: JWT contains session_version claim. Middleware validates this.
  // Server Actions re-validate here for defense-in-depth.

  // 5. Verify business ownership
  if (appUser?.business_id !== parsed.data.businessId) {
    return { success: false, error: "Unauthorized.", code: "AUTH_REQUIRED" };
  }

  // 6. Execute business logic
  try {
    // ... supabase queries
    return { success: true, data: { result: "done" } };
  } catch (err) {
    console.error("[myAction]", err);
    return { success: false, error: "Server error.", code: "SERVER_ERROR" };
  }
}
```

---

# 13. ActionResult Type

```typescript
// lib/api/result.ts
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: import("@/types/domain").ErrorCode };

// Helper for consistent error creation
export function actionError(
  error: string,
  code: import("@/types/domain").ErrorCode,
): ActionResult<never> {
  return { success: false, error, code };
}

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}
```

---

# 14. Notification Pipeline

## SMS Architecture

```
Server Action (e.g., sendRewardOTP)
    ↓
Call Supabase Edge Function: 'send-otp'
    ↓
Edge Function calls MSG91 REST API
    ↓
MSG91 delivers SMS to customer phone
    ↓
Edge Function records result in notifications table
    ↓
Returns { success, requestId } to Server Action
```

## MSG91 Configuration

```bash
# .env.local
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_OTP_TEMPLATE_ID=your_dlt_otp_template_id
MSG91_TRANSACTION_TEMPLATE_ID=your_dlt_txn_template_id
MSG91_SENDER_ID=RWDLOP    # DLT-registered sender ID
```

## OTP SMS Format (DLT Template)

```
Your RewardLoop OTP is {otp}. Valid for 3 minutes. Do not share with anyone.
```

## Transaction Confirmation SMS Format (DLT Template)

```
Visit recorded at {business_name}. Bill: Rs.{final_paid}. Rewards: +Rs.{reward_earned}. Balance: Rs.{new_balance}. - RewardLoop
```

## Fire-and-Forget Rule

Transaction confirmation SMS is sent **after** `complete_visit()` commits successfully. It is called asynchronously and does NOT block the response to the user. If SMS fails, the transaction is still saved. The failure is logged in the `notifications` table.

---

# 15. Single-Device Session Enforcement

**Mechanism:** `session_version` INTEGER column on the `users` table and an HMAC-signed `rl_sv` HTTP-only cookie.

**Flow:**

1. User logs in on Device A. `session_version` = 1. A signed `rl_sv` cookie is issued containing the version using `REWARDLOOP_SESSION_SECRET`.
2. User logs in on Device B. Server Action `verifyOTP()` atomically increments `users.session_version` to 2 via the `increment_session_version` RPC. A new signed cookie is issued.
3. Device A's `rl_sv` cookie still reads version 1.
4. Next request from Device A: Edge Middleware reads `rl_sv` (1), compares it to DB value (2). Mismatch → return 401 `SESSION_REVOKED`. The session is killed and the user redirects to login.

**Implementation note:** `session-validator.ts` provides the single source of truth for both Edge Middleware and Server Actions. Rollback atomicity ensures that if any part of the login fails after verification, the session is cleanly revoked via `try/catch`.

---

# 16. Caching Strategy

| Resource                | Cache Strategy | Service Worker            | TanStack Query |
| ----------------------- | -------------- | ------------------------- | -------------- |
| App Shell (HTML/JS/CSS) | Cache First    | ✅ CacheFirst             | —              |
| Images / Fonts          | Cache First    | ✅ CacheFirst (30 days)   | —              |
| Dashboard API           | Network First  | ✅ NetworkFirst           | 30s staleTime  |
| Catalog API             | Network First  | ✅ NetworkFirst (1hr TTL) | 5min staleTime |
| Transactions API        | Network First  | ✅ NetworkFirst           | 2min staleTime |
| Customer wallet         | Network First  | ❌ Never cache            | 0 staleTime    |
| Reward rules            | Network First  | ✅ NetworkFirst           | 5min staleTime |
| Insights API            | Network First  | ✅ NetworkFirst           | 30s staleTime  |

---

# 17. Error Handling Standards

Every Server Action returns `ActionResult<T>`. No raw errors escape to the client.

```
DB/Network Error → Catch in try/catch → Return ActionResult failure → Client shows toast
Validation Error → Zod parse fail → Return ActionResult VALIDATION_FAILED → Client shows inline
Auth Error → authError || !user → Return ActionResult AUTH_REQUIRED → Client redirects
```

**Never** expose:

- Raw SQL error messages
- Stack traces
- Database IDs in error messages

---

# 18. Coding Standards

- TypeScript strict mode. No `any`. No type casting without comment.
- All monetary arithmetic in paise (INTEGER). `billing-math.ts` is the only place money is calculated.
- Server Actions own all business logic. Components render data only.
- No component calculates billing totals. Components read from Zustand store only.
- All Supabase queries specify columns (no SELECT *).
- All multi-table writes go through Supabase RPC.
- No `console.log` in production code.
- No TODO or FIXME in committed code without a linked issue.
- Zod validates every Server Action input before any DB operation.

---

# 19. Testing Strategy

## Unit Tests (Vitest)

```bash
# Test runner
vitest

# Config file
vitest.config.ts

# Test location
src/features/**/__tests__/*.test.ts
src/lib/**/__tests__/*.test.ts
```

**Priority test targets:**

- `billing-math.ts` — 100% coverage required
- Zod schemas
- Utility functions

## Integration Tests (Vitest + Supabase test DB)

- Server Actions against a local Supabase instance
- RPC function tests

## E2E Tests (Playwright)

```bash
# Config file
playwright.config.ts

# Test location
e2e/

# Key journeys to automate
e2e/auth.spec.ts
e2e/onboarding.spec.ts
e2e/billing-no-reward.spec.ts
e2e/billing-with-reward.spec.ts
e2e/transactions.spec.ts
```

---

# 20. Performance Principles

- Server Components by default
- Client Components only when interactivity is required (forms, counters, stores)
- Lazy loading for non-critical routes
- Skeleton loading states — no full-page spinners
- Cursor-based pagination for transaction lists
- No SELECT * queries
- Indexes on all `WHERE`, `JOIN`, and `ORDER BY` columns

---

# 21. Security Principles

1. Server validates and recalculates everything. Client values are display-only.
2. RLS enforces business_id isolation on every table.
3. Session_version enforces single-device login.
4. OTP is bcrypt-hashed before storage.
5. `SUPABASE_SERVICE_ROLE_KEY` is never exposed to client code.
6. Rate limiting via `otp_requests` table checks (not external middleware — avoid adding a new dependency).
7. Idempotency keys prevent duplicate financial operations.
8. Reward OTP token is single-use and server-verified.
9. All monetary arithmetic uses INTEGER paise — no floating-point.
10. Audit logs capture all security events defined in `audit_event_enum`.

---

# Document Status

✅ **Approved — Implementation Ready**
🔒 **Locked**

**Version 2.0** — Complete application architecture with runtime boundaries, routing, TypeScript interfaces, Supabase RPC functions, state management configuration, and AI coding boundaries. Resolves audit findings A-001 through A-008, F-001 through F-007, AI-001 through AI-004, S-002, S-003, D-010.

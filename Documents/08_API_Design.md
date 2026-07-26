# 08_API_Design.md

> **Project:** RewardLoop
> **Version:** 2.0
> **Status:** ✅ Approved — Implementation Ready
> **Purpose:** Complete API contract for all Server Actions, Edge Functions, and Supabase RPC calls. Defines every function name, input DTO, output DTO, Zod schema, error codes, rate limits, and validation rules.
> **Authority:** Every function defined here must match exactly the implementation in `features/[feature]/actions/`. No undocumented actions. No undocumented parameters.

---

# Table of Contents

1. API Philosophy
2. Standard Response Format
3. Complete Error Code Registry
4. Rate Limits
5. Authentication Module
6. Business Module
7. Customer Module
8. Catalog Module
9. Billing Module
10. Reward Module
11. Dashboard Module
12. Insights Module
13. Transactions Module
14. Notification Module (Edge Functions)
15. Staff Module (Phase 2 — NOT in MVP)
16. Authorization Matrix

---

# 1. API Philosophy

- **Server Actions only** for all mutations and sensitive reads. No direct client–Supabase reads for financial data.
- **Business logic lives on the server.** Frontend never calculates billing totals for final submission.
- **Every request is authenticated** via Supabase Auth session + `session_version` check.
- **Every input is Zod-validated** on the server before any DB operation.
- **Consistent `ActionResult<T>` response format** for all Server Actions.
- **Supabase RPC** for multi-table atomic writes (`complete_visit`).
- **Edge Functions** for external API calls (MSG91 SMS).

---

# 2. Standard Response Format

## TypeScript Type

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode };
```

## Success JSON (illustration)

```json
{ "success": true, "data": { ... } }
```

## Failure JSON (illustration)

```json
{ "success": false, "error": "Human-readable message.", "code": "ERROR_CODE" }
```

---

# 3. Complete Error Code Registry

| Code                     | Description                                          | HTTP Equivalent |
| ------------------------ | ---------------------------------------------------- | --------------- |
| `AUTH_REQUIRED`          | No valid session                                     | 401             |
| `SESSION_EXPIRED`        | JWT expired                                          | 401             |
| `SESSION_REVOKED`        | session_version mismatch (logged in elsewhere)       | 401             |
| `INVALID_OTP`            | OTP code is wrong                                    | 422             |
| `OTP_EXPIRED`            | OTP past 3-minute expiry                             | 422             |
| `OTP_MAX_ATTEMPTS`       | 3 failures on this OTP — code invalidated            | 422             |
| `RATE_LIMITED`           | Too many OTP requests (5 / 15 min)                   | 429             |
| `CUSTOMER_NOT_FOUND`     | No customer with given phone (search only)           | 404             |
| `CUSTOMER_AUTO_CREATED`  | Customer not found, auto-created (signal, not error) | 200             |
| `BUSINESS_NOT_FOUND`     | No business for this user                            | 404             |
| `CATALOG_ITEM_NOT_FOUND` | Catalog item ID not found or inactive                | 404             |
| `REWARD_LIMIT_EXCEEDED`  | reward_applied > maxRedeem                           | 422             |
| `WALLET_INSUFFICIENT`    | reward_applied > wallet balance                      | 422             |
| `VALIDATION_FAILED`      | Zod schema validation failure                        | 422             |
| `DUPLICATE_TRANSACTION`  | Idempotency key already used + committed             | 200 (cached)    |
| `TRANSACTION_FAILED`     | RPC failure mid-write                                | 500             |
| `EDIT_WINDOW_EXPIRED`    | now() > edited_until                                 | 422             |
| `EDIT_FIELD_NOT_ALLOWED` | Attempted to edit non-editable field                 | 422             |
| `OTP_REQUIRED`           | Reward applied > 0 but no OTP token provided         | 422             |
| `SERVER_ERROR`           | Unexpected server exception                          | 500             |

---

# 4. Rate Limits

Rate limits are enforced server-side by checking the `otp_requests` table. No external rate-limiting middleware required in MVP.

| Endpoint          | Limit       | Window       | Scope        |
| ----------------- | ----------- | ------------ | ------------ |
| `sendLoginOTP`    | 5 requests  | 15 minutes   | Per phone    |
| `sendRewardOTP`   | 5 requests  | 15 minutes   | Per phone    |
| `verifyLoginOTP`  | 5 attempts  | Per OTP code | Per phone    |
| `verifyRewardOTP` | 3 attempts  | Per OTP code | Per phone    |
| `completeVisit`   | 10 requests | 1 minute     | Per business |
| `searchCustomer`  | 30 requests | 1 minute     | Per business |
| `getTransactions` | 60 requests | 1 minute     | Per business |

---

# 5. Authentication Module

## `sendLoginOTP`

| Property | Value                               |
| -------- | ----------------------------------- |
| File     | `features/auth/actions/send-otp.ts` |
| Runtime  | Server Action → Supabase Auth       |

### Input DTO

```typescript
interface SendOTPInput {
  phone: string; // 10-digit Indian mobile: "9876543210" (without country code)
}
```

### Zod Schema

```typescript
const SendOTPSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
});
```

### Output DTO

```typescript
interface SendOTPResult {
  sent: true;
}
```

### Behaviour

1. Normalize phone to E.164: `+91` + 10-digit input.
2. Check `rl_otp_lock` signed cookie. If valid, return `RATE_LIMITED`.
3. If cookie missing/invalid, check `check_and_update_otp_cooldown(phone)` RPC. If false, return `RATE_LIMITED`.
4. Call `supabase.auth.signInWithOtp({ phone })` — Supabase Auth handles OTP generation and MSG91 delivery.
5. Set `rl_otp_lock` cookie and return `{ success: true, data: { sent: true } }`.

---

## `verifyLoginOTP`

| Property | Value                                 |
| -------- | ------------------------------------- |
| File     | `features/auth/actions/verify-otp.ts` |
| Runtime  | Server Action → Supabase Auth         |

### Input DTO

```typescript
interface VerifyOTPInput {
  phone: string; // 10-digit format
  otp: string; // 6-digit numeric string
}
```

### Zod Schema

```typescript
const VerifyOTPSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits."),
});
```

### Output DTO

```typescript
interface VerifyOTPResult {
  isNewUser: boolean; // true = redirect to onboarding
  hasCompletedOnboarding: boolean;
  redirectTo: string;
}
```

### Behaviour

1. Call `supabase.auth.verifyOtp({ phone: normalized, token: otp, type: 'sms' })`.
2. On success: Fetch or create `users` record. Check `business_id` for onboarding status.
3. Call `increment_session_version` RPC via service role and issue a new HMAC-signed `rl_sv` cookie.
4. If any step fails post-verification, trigger Authentication Rollback (force sign-out, delete cookies, return `SERVER_ERROR`).
5. Return `{ isNewUser, hasCompletedOnboarding, redirectTo }`.

---

## `logout`

| Property | Value                             |
| -------- | --------------------------------- |
| File     | `features/auth/actions/logout.ts` |
| Runtime  | Server Action → Supabase Auth     |

### Input DTO

```typescript
// No input required — uses session
```

### Output DTO

```typescript
interface LogoutResult {
  loggedOut: true;
}
```

### Behaviour

1. Call `increment_session_version` RPC via service role to invalidate all existing device sessions cryptographically.
2. Call `supabase.auth.signOut()` to kill the underlying Supabase Auth session.
3. Delete the `rl_sv` cookie.
4. Return `{ success: true, data: { loggedOut: true } }`.

---

# 6. Business Module

## `createBusiness`

| Property | Value                                            |
| -------- | ------------------------------------------------ |
| File     | `features/onboarding/actions/create-business.ts` |
| Runtime  | Server Action                                    |

### Input DTO

```typescript
interface CreateBusinessInput {
  name: string; // 2–50 chars
  businessType:
    "salon" | "spa" | "gym" | "cafe" | "clinic" | "car_wash" | "other";
  rewardPercentage: number; // 1–50 integer
  maxRedeemPercentage: number; // 1–50 integer
  catalogItems?: {
    name: string;
    price: number; // In paise
  }[];
}
```

### Zod Schema

```typescript
const CreateBusinessSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .transform((s) => s.trim()),
  businessType: z.enum([
    "salon",
    "spa",
    "gym",
    "cafe",
    "clinic",
    "car_wash",
    "other",
  ]),
  rewardPercentage: z.number().int().min(1).max(50),
  maxRedeemPercentage: z.number().int().min(1).max(50),
  catalogItems: z
    .array(
      z.object({
        name: z
          .string()
          .min(1)
          .max(100)
          .transform((s) => s.trim()),
        price: z.number().int().min(100), // Minimum 100 paise (₹1)
      }),
    )
    .optional()
    .default([]),
});
```

### Output DTO

```typescript
interface CreateBusinessResult {
  businessId: string;
}
```

### Behaviour

1. Validate input with Zod.
2. Insert `businesses` record.
3. Insert `catalogs` record (one per business).
4. Insert `catalog_items` records (if provided).
5. Insert `reward_rules` record.
6. Update `users.business_id` to the new business ID.
7. Return `businessId`.

---

## `getBusiness`

### Input DTO

```typescript
// No input — reads from session
```

### Output DTO

```typescript
interface GetBusinessResult {
  business: Business;
  rewardRules: RewardRules;
}
```

---

## `updateBusiness`

### Input DTO

```typescript
interface UpdateBusinessInput {
  name?: string;
  businessType?: Business["businessType"];
  logoUrl?: string;
  gstNumber?: string;
  address?: string;
  email?: string;
}
```

### Output DTO

```typescript
interface UpdateBusinessResult {
  business: Business;
}
```

---

## `updateRewardRules`

### Input DTO

```typescript
interface UpdateRewardRulesInput {
  rewardPercentage: number; // 1–50 integer
  maxRedeemPercentage: number; // 1–50 integer
}
```

### Zod Schema

```typescript
const UpdateRewardRulesSchema = z.object({
  rewardPercentage: z.number().int().min(1).max(50),
  maxRedeemPercentage: z.number().int().min(1).max(50),
});
```

### Output DTO

```typescript
interface UpdateRewardRulesResult {
  rewardRules: RewardRules;
}
```

### Behaviour

1. UPSERT `reward_rules` record for this `business_id`.
2. Log `REWARD_RULES_UPDATED` to `audit_logs`.

---

# 7. Customer Module

## `searchCustomer`

| Property | Value                                          |
| -------- | ---------------------------------------------- |
| File     | `features/customer/actions/search-customer.ts` |
| Runtime  | Server Action                                  |

### Input DTO

```typescript
interface SearchCustomerInput {
  phone: string; // 10-digit
}
```

### Output DTO

```typescript
interface SearchCustomerResult {
  found: boolean;
  customer: CustomerSummary | null;
  autoCreated: boolean; // true if customer was just created
}
```

### Behaviour

1. Normalize phone to E.164.
2. SELECT customer + wallet WHERE `business_id = $1 AND phone = $2`.
3. If found: Return `{ found: true, customer: { id, phone, name, walletBalance } }`.
4. If not found: Call `auto_create_customer` RPC → Return `{ found: false, customer: newCustomer, autoCreated: true }`.

---

# 8. Catalog Module

## `getCatalog`

### Input DTO

```typescript
// No input — reads from session business_id
```

### Output DTO

```typescript
interface GetCatalogResult {
  items: CatalogItem[];
}
// Only returns items with status = 'active'
```

---

## `createCatalogItem`

### Input DTO

```typescript
interface CreateCatalogItemInput {
  type: "service" | "product";
  name: string; // 1–100 chars
  price: number; // Paise, minimum 100
}
```

### Zod Schema

```typescript
const CreateCatalogItemSchema = z.object({
  type: z.enum(["service", "product"]),
  name: z
    .string()
    .min(1)
    .max(100)
    .transform((s) => s.trim()),
  price: z.number().int().min(100, "Minimum price is ₹1."),
});
```

### Output DTO

```typescript
interface CreateCatalogItemResult {
  item: CatalogItem;
}
```

---

## `updateCatalogItem`

### Input DTO

```typescript
interface UpdateCatalogItemInput {
  id: string; // UUID
  type?: "service" | "product";
  name?: string;
  price?: number; // Paise
}
```

### Output DTO

```typescript
interface UpdateCatalogItemResult {
  item: CatalogItem;
}
```

---

## `toggleCatalogItemStatus`

### Input DTO

```typescript
interface ToggleCatalogItemInput {
  id: string; // UUID
  status: "active" | "inactive";
}
```

### Output DTO

```typescript
interface ToggleCatalogItemResult {
  item: Pick<CatalogItem, "id" | "status">;
}
```

---

# 9. Billing Module

## `getRewardRules`

Used at billing session start to load reward rules for client-side display calculation.

### Output DTO

```typescript
interface GetRewardRulesResult {
  rewardPercentage: number;
  maxRedeemPercentage: number;
}
```

**TanStack Query staleTime:** 5 minutes (reward rules rarely change during a session).

---

## `completeVisit`

> **CRITICAL:** This is NOT a raw Server Action for the DB write. The Server Action validates and pre-processes the payload, then calls `supabase.rpc('complete_visit', payload)` to execute the atomic DB transaction.

| Property | Value                                           |
| -------- | ----------------------------------------------- |
| File     | `features/checkout/actions/complete-visit.ts`   |
| Runtime  | Server Action → Supabase RPC `complete_visit()` |

### Input DTO

```typescript
interface CompleteVisitInput {
  idempotencyKey: string; // UUID generated on /visit page mount
  customerId: string;
  items: {
    catalogItemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number; // Paise
    totalPrice: number; // Paise
  }[];
  rewardApplied: number; // Paise (0 if no redemption)
  paymentMethod: "cash" | "online" | "none";
  otpVerifiedToken: string | null; // Required if rewardApplied > 0
}
```

### Zod Schema

```typescript
const CompleteVisitSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    customerId: z.string().uuid(),
    items: z
      .array(
        z.object({
          catalogItemId: z.string().uuid(),
          itemName: z.string().min(1).max(100),
          quantity: z.number().int().min(1),
          unitPrice: z.number().int().min(0),
          totalPrice: z.number().int().min(0),
        }),
      )
      .min(1, "At least one item required."),
    rewardApplied: z.number().int().min(0),
    paymentMethod: z.enum(["cash", "online", "none"]),
    otpVerifiedToken: z.string().nullable(),
  })
  .refine(
    (data) => data.rewardApplied === 0 || data.otpVerifiedToken !== null,
    {
      message: "OTP token required when reward is applied.",
      path: ["otpVerifiedToken"],
    },
  )
  .refine((data) => data.paymentMethod === "none" || data.items.length > 0, {
    message: "Payment method required.",
    path: ["paymentMethod"],
  });
```

### Output DTO

```typescript
interface CompleteVisitResult {
  transactionId: string;
  subtotal: number; // Paise (server-computed)
  rewardUsed: number; // Paise
  rewardEarned: number; // Paise
  finalPaid: number; // Paise
  duplicate: boolean; // true if idempotency key was already committed
}
```

### Server Action Behaviour (before calling RPC)

1. Validate input with Zod.
2. Verify auth session + session_version.
3. If `rewardApplied > 0`: Validate `otpVerifiedToken` against `otp_requests` table (verified_at not null, not expired).
4. Mark OTP as consumed (set `invalidated = true`).
5. Call `supabase.rpc('complete_visit', { ...payload, business_id: session.businessId, created_by: session.userId })`.
6. On RPC success: Trigger fire-and-forget SMS via `send-transaction-sms` Edge Function.
7. Return `CompleteVisitResult`.

---

# 10. Reward Module

## `sendRewardOTP`

| Property | Value                                        |
| -------- | -------------------------------------------- |
| File     | `features/reward/actions/send-reward-otp.ts` |
| Runtime  | Server Action → `send-otp` Edge Function     |

### Input DTO

```typescript
interface SendRewardOTPInput {
  customerPhone: string; // 10-digit
  rewardAmountPaise: number; // Must be > 0
}
```

### Zod Schema

```typescript
const SendRewardOTPSchema = z.object({
  customerPhone: z.string().regex(/^[6-9]\d{9}$/),
  rewardAmountPaise: z.number().int().min(100, "Minimum redemption is ₹1."),
});
```

### Output DTO

```typescript
interface SendRewardOTPResult {
  sent: true;
  expiresAt: string; // ISO timestamp — 3 minutes from now
}
```

### Behaviour

1. Validate input.
2. Check rate limit (5 requests / 15 min per phone) via `otp_requests` table.
3. Generate 6-digit OTP. Hash with bcrypt (rounds: 10).
4. Insert `otp_requests` record: `{ phone: E164, purpose: 'reward_redemption', business_id, otp_hash, expires_at: now() + 3 min }`.
5. Call `send-otp` Edge Function with `{ phone, otp }`.
6. Return `{ sent: true, expiresAt }`.

---

## `verifyRewardOTP`

| Property | Value                                          |
| -------- | ---------------------------------------------- |
| File     | `features/reward/actions/verify-reward-otp.ts` |
| Runtime  | Server Action → `verify-otp` Edge Function     |

### Input DTO

```typescript
interface VerifyRewardOTPInput {
  customerPhone: string; // 10-digit
  otp: string; // 6 digits
}
```

### Zod Schema

```typescript
const VerifyRewardOTPSchema = z.object({
  customerPhone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().regex(/^\d{6}$/, "Enter 6-digit code."),
});
```

### Output DTO

```typescript
interface VerifyRewardOTPResult {
  verified: true;
  otpRequestId: string; // UUID of the otp_requests record
  // This ID is passed to completeVisit as the otpVerifiedToken.
  // completeVisit validates that otp_requests(id).verified_at IS NOT NULL
  // and that the record belongs to the correct phone + business.
}
```

### Behaviour

1. Find latest non-expired, non-invalidated `otp_requests` record for this phone + `purpose = 'reward_redemption'` + `business_id`.
2. Check `expires_at > now()`. If expired → return `OTP_EXPIRED`.
3. Check `attempts < max_attempts`. If exceeded → return `OTP_MAX_ATTEMPTS`.
4. Compare bcrypt(input_otp) against `otp_hash`.
5. If wrong: Increment `attempts`. If `attempts >= max_attempts`, set `invalidated = true`. Return `INVALID_OTP`.
6. If correct: Set `verified_at = now()`. Return `{ verified: true, otpRequestId: record.id }`.

---

# 11. Dashboard Module

## `getDashboard`

| Property | Value                                         |
| -------- | --------------------------------------------- |
| File     | `features/dashboard/actions/get-dashboard.ts` |
| Runtime  | Server Action                                 |

### Output DTO

```typescript
interface GetDashboardResult {
  todayRevenue: number; // Paise
  todayCustomerCount: number;
  recentTransactions: TransactionCard[]; // 5 most recent
}
```

### SQL (server-side query pattern)

```sql
-- Today's revenue
SELECT COALESCE(SUM(final_paid), 0) AS today_revenue
FROM transactions
WHERE business_id = $1
  AND created_at >= CURRENT_DATE
  AND created_at < CURRENT_DATE + INTERVAL '1 day';

-- Today's customers
SELECT COUNT(DISTINCT customer_id) AS today_customer_count
FROM transactions
WHERE business_id = $1
  AND created_at >= CURRENT_DATE;

-- Recent 5 transactions
SELECT t.id, c.name, c.phone, t.final_paid, t.reward_used, t.payment_method, t.created_at
FROM transactions t
JOIN customers c ON t.customer_id = c.id
WHERE t.business_id = $1
ORDER BY t.created_at DESC
LIMIT 5;
```

---

# 12. Insights Module

## `getInsights`

> **Scope: Today only (MVP).** Multi-period insights (Yesterday, Weekly, Monthly) are a Phase 2 feature.
> This resolves contradiction C-001 (Founder Decision 17 vs. old API doc). Founder Decision 17 wins.

| Property | Value                                       |
| -------- | ------------------------------------------- |
| File     | `features/insights/actions/get-insights.ts` |
| Runtime  | Server Action                               |

### Input DTO

```typescript
interface GetInsightsInput {
  period: "today"; // Only 'today' accepted in MVP. Server rejects other values.
}
```

### Output DTO

```typescript
interface GetInsightsResult {
  period: "today";
  revenue: number; // Paise — sum of final_paid today
  customerCount: number; // Distinct customers billed today
  totalRewardsGiven: number; // Paise — sum of reward_earned today
}
```

---

# 13. Transactions Module

## `getTransactions`

### Input DTO

```typescript
interface GetTransactionsInput {
  cursor?: string; // ISO timestamp for cursor pagination
  limit?: number; // Default 20, max 50
  search?: string; // Phone or name partial match
  dateFilter?: "today" | "yesterday" | "this_week" | "this_month";
  paymentFilter?: "cash" | "online";
  rewardFilter?: "with_reward" | "without_reward";
}
```

### Zod Schema

```typescript
const GetTransactionsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  search: z.string().max(50).optional(),
  dateFilter: z
    .enum(["today", "yesterday", "this_week", "this_month"])
    .optional(),
  paymentFilter: z.enum(["cash", "online"]).optional(),
  rewardFilter: z.enum(["with_reward", "without_reward"]).optional(),
});
```

### Output DTO

```typescript
interface GetTransactionsResult {
  transactions: TransactionCard[];
  nextCursor: string | null; // null if no more records
  total: number;
}
```

---

## `getTransaction`

### Input DTO

```typescript
interface GetTransactionInput {
  id: string; // UUID
}
```

### Output DTO

```typescript
interface GetTransactionResult {
  transaction: TransactionDetail; // Includes items, customer, audit logs
}
```

---

## `updateTransaction`

> **Only `payment_method` field is editable. Server rejects requests to change any other field.**
> This resolves audit findings P-008 and API-007.

### Input DTO

```typescript
interface UpdateTransactionInput {
  id: string;
  paymentMethod: "cash" | "online"; // Only editable field
  reason: string; // Required audit trail reason (2–200 chars)
}
```

### Zod Schema

```typescript
const UpdateTransactionSchema = z.object({
  id: z.string().uuid(),
  paymentMethod: z.enum(["cash", "online"]),
  reason: z
    .string()
    .min(2, "Reason must be at least 2 characters.")
    .max(200)
    .transform((s) => s.trim()),
});
```

### Output DTO

```typescript
interface UpdateTransactionResult {
  transactionId: string;
  paymentMethod: "cash" | "online";
  updatedAt: string;
}
```

### Server Behaviour

1. SELECT transaction WHERE `id = $1 AND business_id = $session.businessId`.
2. Check `now() <= edited_until`. If expired → `EDIT_WINDOW_EXPIRED`.
3. UPDATE `transactions SET payment_method = $2` WHERE `id = $1`.
4. INSERT `audit_logs` record: `event = 'TRANSACTION_EDITED', old_value = { payment_method: old }, new_value = { payment_method: new }, metadata = { reason: $reason }`.
5. Return updated transaction.

---

# 14. Notification Module (Edge Functions)

> Edge Functions are NOT called directly from the frontend. They are invoked by Server Actions.

## `send-otp` (Edge Function)

**Trigger:** Called by `sendLoginOTP` or `sendRewardOTP` Server Actions.

### Input (internal)

```typescript
interface SendOTPEdgeFunctionPayload {
  phone: string; // E.164
  otp: string; // Plain text 6-digit (never stored — only for MSG91)
  purpose: "login" | "reward_redemption";
  templateId: string; // MSG91 DLT template ID
}
```

### Behaviour

1. Call MSG91 REST API: `POST https://api.msg91.com/api/v5/flow/`
2. Record delivery attempt in `notifications` table.
3. Return `{ success, requestId }` to calling Server Action.

---

## `send-transaction-sms` (Edge Function)

**Trigger:** Fire-and-forget after `complete_visit()` RPC commits successfully.

### Input (internal)

```typescript
interface SendTransactionSMSPayload {
  phone: string; // E.164
  businessName: string;
  finalPaid: number; // Paise (converted to rupees for display)
  rewardEarned: number; // Paise
  newBalance: number; // Paise (post-transaction wallet balance)
}
```

---

# 15. Staff Module (Phase 2 — NOT IN MVP)

> **STATUS: REMOVED FROM MVP.**
>
> The Staff Management API (getStaff, inviteStaff, approveStaff, suspendStaff, removeStaff) is **not implemented in MVP**.
>
> Decision 24 in `00_Founder_Decisions.md` lists "Staff Roles" as out of scope.
>
> The `features/staff/` folder does NOT exist in MVP.
>
> All staff-related endpoints are reserved for Phase 2 and documented in the future enhancements section.
>
> This resolves audit findings P-003 and F-001.

---

# 16. Authorization Matrix

In MVP, all authenticated users with a valid business act as owners (full access).

| Action                    | MVP                                  |
| ------------------------- | ------------------------------------ |
| `sendLoginOTP`            | Public                               |
| `verifyLoginOTP`          | Public                               |
| `logout`                  | Auth required                        |
| `createBusiness`          | Auth, no business yet                |
| `getBusiness`             | Auth + business                      |
| `updateBusiness`          | Auth + business                      |
| `updateRewardRules`       | Auth + business                      |
| `searchCustomer`          | Auth + business                      |
| `getCatalog`              | Auth + business                      |
| `createCatalogItem`       | Auth + business                      |
| `updateCatalogItem`       | Auth + business                      |
| `toggleCatalogItemStatus` | Auth + business                      |
| `getRewardRules`          | Auth + business                      |
| `sendRewardOTP`           | Auth + business                      |
| `verifyRewardOTP`         | Auth + business                      |
| `completeVisit`           | Auth + business                      |
| `getDashboard`            | Auth + business                      |
| `getInsights`             | Auth + business                      |
| `getTransactions`         | Auth + business                      |
| `getTransaction`          | Auth + business                      |
| `updateTransaction`       | Auth + business + within edit window |

---

# Document Status

✅ **Approved — Implementation Ready**
🔒 **Locked**

**Version 2.0** — Complete API contract with full DTOs, Zod schemas, error codes, rate limits, and explicit behaviour documentation. Resolves audit findings API-001 through API-008, P-003, P-007, P-008, P-009, S-005, C-001, C-006, C-007.

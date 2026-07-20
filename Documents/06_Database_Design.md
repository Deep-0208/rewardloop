# 06_Database_Design.md

> **Project:** RewardLoop
> **Version:** 2.0
> **Status:** ✅ Approved — Implementation Ready
> **Database:** PostgreSQL via Supabase
> **Purpose:** Complete relational database specification including CREATE TABLE DDL, constraints, indexes, enums, RLS policies, migration order, and seed data. This is the single source of truth for the Supabase database schema.

---

# Table of Contents

1. Database Philosophy
2. Database Standards
3. Monetary Storage Standard
4. Multi-Tenant Strategy
5. Enum Definitions
6. Table Definitions (DDL)
7. Indexes
8. Row Level Security Policies
9. Entity Relationships
10. Migration Order
11. Seed Data Specification
12. Audit Column Policy
13. Idempotency Strategy
14. Performance Guidelines
15. Backup Strategy

---

# 1. Database Philosophy

RewardLoop uses PostgreSQL through Supabase. The database prioritizes:

- **Data integrity** — Financial records are immutable. Constraints enforce correctness.
- **Performance** — All queries use indexed columns. No SELECT *.
- **Security** — RLS enforces business_id isolation on every table.
- **Simplicity** — No unnecessary tables. No premature optimization.
- **Audit** — Every mutation is traceable.

Every table belongs to exactly one bounded context.

---

# 2. Database Standards

## Primary Keys

Every table uses `UUID` generated via `gen_random_uuid()`.

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

## Foreign Keys

Every relationship uses explicit foreign key constraints with cascade behavior defined.

## Timestamps

Every table contains:

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

Financial records (transactions, reward_ledger) do NOT have `updated_at` — they are immutable.

## Soft Delete

Business configuration records use:

```sql
deleted_at TIMESTAMPTZ
```

Financial records (transactions, reward_ledger) **never support deletion**.

---

# 3. Monetary Storage Standard

> **CRITICAL RULE: All monetary values are stored as INTEGER representing PAISE.**
>
> 1 Indian Rupee = 100 paise
>
> ₹10.00 is stored as `1000`
>
> ₹0.50 is stored as `50`

**Rationale:** JavaScript floating-point arithmetic produces rounding errors in money calculations. Integer paise avoids all floating-point math.

**Conversion rule:**

- To display: `value_in_paise / 100` (format with 2 decimal places)
- To store: `Math.round(rupee_amount * 100)` — but the Billing Engine works entirely in paise on the server.

## Affected columns

All columns with these suffixes or names use INTEGER paise:

- `price`, `unit_price`, `total_price`
- `subtotal`, `final_paid`, `reward_used`, `reward_earned`
- `current_balance`, `amount` (in reward_ledger)
- `balance_after` (in reward_ledger)

---

# 4. Multi-Tenant Strategy

RewardLoop is a multi-tenant SaaS application. **Every business accesses only its own data.**

Every table containing business data includes a non-nullable `business_id` column.

| Table             | business_id present       | RLS enforced         |
| ----------------- | ------------------------- | -------------------- |
| businesses        | Self (id)                 | Owner only           |
| users             | ✅                        | ✅                   |
| customers         | ✅                        | ✅                   |
| catalogs          | ✅                        | ✅                   |
| catalog_items     | ✅ (denormalized)         | ✅                   |
| reward_rules      | ✅                        | ✅                   |
| reward_wallets    | ✅                        | ✅ (via business_id) |
| reward_ledger     | ✅ (via wallet JOIN)      | ✅                   |
| transactions      | ✅                        | ✅                   |
| transaction_items | ✅ (via transaction JOIN) | ✅                   |
| otp_requests      | ✅ (nullable for login)   | partial              |
| idempotency_keys  | ✅                        | ✅                   |
| notifications     | ✅                        | ✅                   |
| audit_logs        | ✅                        | ✅                   |

---

# 5. Enum Definitions

```sql
-- Business type
CREATE TYPE business_type_enum AS ENUM (
  'salon',
  'spa',
  'gym',
  'cafe',
  'clinic',
  'car_wash',
  'other'
);

-- Business status
CREATE TYPE business_status_enum AS ENUM (
  'active',
  'suspended',
  'deleted'
);

-- User role
CREATE TYPE user_role_enum AS ENUM (
  'owner',
  'staff'   -- Reserved for Phase 2 Staff Management
);

-- User status
CREATE TYPE user_status_enum AS ENUM (
  'active',
  'suspended',
  'removed'
);

-- Catalog item type
CREATE TYPE catalog_item_type_enum AS ENUM (
  'service'
  -- 'product' reserved for Phase 2
);

-- Catalog item status
CREATE TYPE catalog_item_status_enum AS ENUM (
  'active',
  'inactive'
);

-- Payment method
CREATE TYPE payment_method_enum AS ENUM (
  'cash',
  'online',
  'none'   -- Used when final_paid = 0
);

-- Reward ledger entry type
CREATE TYPE ledger_type_enum AS ENUM (
  'earned',
  'redeemed'
);

-- OTP purpose
CREATE TYPE otp_purpose_enum AS ENUM (
  'login',
  'reward_redemption'
);

-- Notification type
CREATE TYPE notification_type_enum AS ENUM (
  'otp',
  'transaction_confirmation'
);

-- Notification status
CREATE TYPE notification_status_enum AS ENUM (
  'pending',
  'sent',
  'failed'
);

-- Notification provider
CREATE TYPE notification_provider_enum AS ENUM (
  'sms',
  'whatsapp'  -- Reserved for Phase 2
);

-- Audit event type
CREATE TYPE audit_event_enum AS ENUM (
  'TRANSACTION_CREATED',
  'TRANSACTION_EDITED',
  'REWARD_REDEEMED',
  'REWARD_EARNED',
  'OTP_SENT',
  'OTP_VERIFIED',
  'OTP_FAILED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'SESSION_REVOKED',
  'BUSINESS_UPDATED',
  'REWARD_RULES_UPDATED',
  'CATALOG_ITEM_CREATED',
  'CATALOG_ITEM_UPDATED',
  'CATALOG_ITEM_DEACTIVATED',
  'CUSTOMER_CREATED',
  'WALLET_UPDATED'
);
```

---

# 6. Table Definitions (DDL)

> **Migration order matters.** Tables with foreign key dependencies must be created after their referenced tables.
> See Section 10 (Migration Order) for the exact sequence.

---

## 6.1 `businesses`

```sql
CREATE TABLE businesses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(50) NOT NULL CHECK (char_length(trim(name)) >= 2),
  business_type   business_type_enum NOT NULL,
  logo_url        TEXT,
  gst_number      VARCHAR(15),
  address         TEXT,
  email           VARCHAR(255),
  status          business_status_enum NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IMPORTANT: reward_percentage and max_redeem_percentage are NOT in this table.
-- They live exclusively in reward_rules. See Section 6.6.
-- This resolves audit finding D-004.
```

---

## 6.2 `users`

```sql
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID REFERENCES businesses(id) ON DELETE SET NULL,
  auth_user_id     UUID NOT NULL UNIQUE,  -- References auth.users(id) in Supabase
  name             VARCHAR(100),
  phone            VARCHAR(15) NOT NULL,  -- E.164 format: +91XXXXXXXXXX
  role             user_role_enum NOT NULL DEFAULT 'owner',
  status           user_status_enum NOT NULL DEFAULT 'active',
  session_version  INTEGER NOT NULL DEFAULT 1,  -- Incremented on new login to invalidate old sessions
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- business_id is NULL during onboarding (user created at auth, business created at step 1 of onboarding).
-- business_id is SET after completeOnboarding() is called.
-- This resolves audit finding DR-005.

-- session_version is the single-device enforcement mechanism.
-- On each new login, session_version increments.
-- All active JWTs embed the session_version at issue time.
-- Server rejects JWTs where embedded version < current session_version.
-- This resolves audit finding S-002.

COMMENT ON COLUMN users.session_version IS
  'Incremented on each new device login. Server validates JWT session_version matches this value. Mismatches indicate stale sessions.';
COMMENT ON COLUMN users.phone IS
  'E.164 format: +91XXXXXXXXXX for Indian numbers. 15 chars max.';
```

---

## 6.3 `customers`

```sql
CREATE TABLE customers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  phone          VARCHAR(15) NOT NULL,  -- E.164 format: +91XXXXXXXXXX
  name           VARCHAR(100),          -- Optional
  total_visits   INTEGER NOT NULL DEFAULT 0 CHECK (total_visits >= 0),
  last_visit_at  TIMESTAMPTZ,
  created_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  -- Audit column per Section 12 Audit Column Policy.
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ,           -- Soft delete

  CONSTRAINT customers_business_phone_unique UNIQUE (business_id, phone)
  -- Same phone at different businesses = different customer records.
  -- This enforces per-business customer isolation.
);

COMMENT ON COLUMN customers.phone IS
  'E.164 format. Same phone can exist at multiple businesses — isolation is per business_id.';
```

---

## 6.4 `catalogs`

```sql
CREATE TABLE catalogs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()

  -- UNIQUE on business_id enforces one catalog per business.
);
```

---

## 6.5 `catalog_items`

```sql
CREATE TABLE catalog_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id   UUID NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  -- business_id is denormalized here for direct RLS enforcement without joining through catalogs.
  -- This resolves audit finding D-009.
  type         catalog_item_type_enum NOT NULL DEFAULT 'service',
  name         VARCHAR(100) NOT NULL CHECK (char_length(trim(name)) >= 1),
  price        INTEGER NOT NULL CHECK (price >= 100),
  -- price in paise. Minimum ₹1 (100 paise).
  status       catalog_item_status_enum NOT NULL DEFAULT 'active',
  created_by   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by   UUID REFERENCES users(id) ON DELETE RESTRICT,
  -- Audit columns per Section 12 Audit Column Policy.
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN catalog_items.price IS 'Price in paise (integer). 100 = ₹1.00. Minimum 100 paise (₹1).';
COMMENT ON COLUMN catalog_items.business_id IS 'Denormalized from catalogs for direct RLS enforcement.';
```

---

## 6.6 `reward_rules`

```sql
CREATE TABLE reward_rules (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id              UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  -- UNIQUE enforces one active reward rule record per business.
  reward_percentage        SMALLINT NOT NULL CHECK (reward_percentage BETWEEN 1 AND 50),
  max_redeem_percentage    SMALLINT NOT NULL CHECK (max_redeem_percentage BETWEEN 1 AND 50),
  created_by               UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by               UUID REFERENCES users(id) ON DELETE RESTRICT,
  -- Audit columns per Section 12 Audit Column Policy.
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SOLE SOURCE OF TRUTH for reward configuration.
-- businesses table does NOT contain reward_percentage or max_redeem_percentage.
-- This resolves audit finding D-004.

COMMENT ON TABLE reward_rules IS
  'Sole source of reward configuration. businesses table MUST NOT duplicate these columns.';
COMMENT ON COLUMN reward_rules.reward_percentage IS
  'Integer 1–50. Percentage of Final Amount earned as loyalty reward.';
COMMENT ON COLUMN reward_rules.max_redeem_percentage IS
  'Integer 1–50. Maximum percentage of Subtotal that can be paid with rewards.';
```

---

## 6.7 `reward_wallets`

```sql
CREATE TABLE reward_wallets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  -- business_id added to enforce per-business wallet isolation.
  -- A customer at Salon A and Salon B has TWO separate wallets.
  -- This resolves audit finding D-002 (critical bug: wallet missing business_id).
  current_balance  INTEGER NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  -- current_balance in paise. Cannot be negative.
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT reward_wallets_customer_business_unique UNIQUE (customer_id, business_id)
  -- One wallet per customer per business.
);

COMMENT ON COLUMN reward_wallets.current_balance IS
  'Balance in paise. Must always equal SUM of all earned - SUM of all redeemed in reward_ledger for this wallet.';
COMMENT ON COLUMN reward_wallets.business_id IS
  'Per-business wallet. Same customer has separate wallets at different businesses.';
```

---

## 6.8 `reward_ledger`

```sql
CREATE TABLE reward_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       UUID NOT NULL REFERENCES reward_wallets(id) ON DELETE RESTRICT,
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  -- Denormalized for direct RLS enforcement.
  transaction_id  UUID REFERENCES transactions(id) ON DELETE RESTRICT,
  type            ledger_type_enum NOT NULL,
  amount          INTEGER NOT NULL CHECK (amount > 0),
  -- amount in paise. Always positive regardless of type.
  balance_after   INTEGER NOT NULL CHECK (balance_after >= 0),
  -- Snapshot of wallet balance after this entry.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  -- No updated_at — ledger is immutable.
);

-- APPEND ONLY. Never UPDATE or DELETE.
-- This is the authoritative audit trail for wallet movements.

COMMENT ON TABLE reward_ledger IS
  'Immutable append-only audit trail. Never UPDATE or DELETE rows.';
COMMENT ON COLUMN reward_ledger.amount IS
  'Always positive integer paise. Type (earned/redeemed) indicates direction.';
COMMENT ON COLUMN reward_ledger.balance_after IS
  'Wallet balance snapshot after this entry. Used to verify ledger integrity.';
```

---

## 6.9 `transactions`

```sql
CREATE TABLE transactions (
  id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key                UUID NOT NULL UNIQUE,
  -- Prevents duplicate transactions on network retry.
  -- This resolves audit finding API-005 and B-002.
  business_id                    UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  customer_id                    UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  created_by                     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subtotal                       INTEGER NOT NULL CHECK (subtotal >= 0),
  reward_used                    INTEGER NOT NULL DEFAULT 0 CHECK (reward_used >= 0),
  reward_earned                  INTEGER NOT NULL DEFAULT 0 CHECK (reward_earned >= 0),
  final_paid                     INTEGER NOT NULL CHECK (final_paid >= 0),
  payment_method                 payment_method_enum NOT NULL,
  reward_percentage_applied      SMALLINT NOT NULL,
  -- Snapshot of reward_rules.reward_percentage at billing time.
  max_redeem_percentage_applied  SMALLINT NOT NULL,
  -- Snapshot of reward_rules.max_redeem_percentage at billing time.
  -- These two columns resolve audit finding D-005 (reward rule history).
  edited_until                   TIMESTAMPTZ NOT NULL,
  -- = created_at + 5 minutes. After this, payment_method cannot be edited.
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT now()
  -- No updated_at — financial totals are immutable.
);

COMMENT ON COLUMN transactions.idempotency_key IS
  'UUIDv4 generated by client per checkout session. Server rejects duplicate keys (returns existing record).';
COMMENT ON COLUMN transactions.reward_percentage_applied IS
  'Snapshot of the reward % active at billing time. Historical accuracy.';
COMMENT ON COLUMN transactions.max_redeem_percentage_applied IS
  'Snapshot of the max redeem % active at billing time. Historical accuracy.';
COMMENT ON COLUMN transactions.edited_until IS
  'Timestamp after which this transaction is fully immutable. Set to created_at + 5 minutes.';
COMMENT ON COLUMN transactions.subtotal IS 'In paise.';
COMMENT ON COLUMN transactions.reward_used IS 'In paise.';
COMMENT ON COLUMN transactions.reward_earned IS 'In paise.';
COMMENT ON COLUMN transactions.final_paid IS 'In paise.';
```

---

## 6.10 `transaction_items`

```sql
CREATE TABLE transaction_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  -- Denormalized for direct RLS enforcement.
  catalog_item_id UUID REFERENCES catalog_items(id) ON DELETE SET NULL,
  -- Nullable: if catalog item is deleted, historical record is preserved.
  item_name       VARCHAR(100) NOT NULL,
  -- Snapshot of name at billing time. Immutable.
  quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit_price      INTEGER NOT NULL CHECK (unit_price >= 0),
  -- Snapshot of price at billing time. In paise.
  total_price     INTEGER NOT NULL CHECK (total_price >= 0),
  -- = unit_price * quantity. In paise.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  -- No updated_at — immutable.
);

COMMENT ON COLUMN transaction_items.item_name IS
  'Price and name snapshot at billing time. Preserved even if catalog item changes later.';
COMMENT ON COLUMN transaction_items.unit_price IS 'In paise.';
COMMENT ON COLUMN transaction_items.total_price IS 'In paise.';
```

---

## 6.11 `otp_requests`

```sql
CREATE TABLE otp_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        VARCHAR(15) NOT NULL,       -- E.164 format
  purpose      otp_purpose_enum NOT NULL,
  business_id  UUID REFERENCES businesses(id) ON DELETE CASCADE,
  -- NULL for login OTPs. Set for reward_redemption OTPs.
  otp_hash     TEXT NOT NULL,              -- bcrypt hash of the OTP code. Never plain text.
  expires_at   TIMESTAMPTZ NOT NULL,       -- = created_at + 3 minutes
  attempts     SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts SMALLINT NOT NULL DEFAULT 3,
  verified_at  TIMESTAMPTZ,               -- Set when OTP is successfully verified
  invalidated  BOOLEAN NOT NULL DEFAULT FALSE,  -- Manually invalidated on max attempts
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN otp_requests.otp_hash IS
  'bcrypt hash of the 6-digit OTP. NEVER store plain text OTP.';
COMMENT ON COLUMN otp_requests.expires_at IS
  'created_at + 3 minutes. Server rejects verification after this timestamp.';
COMMENT ON COLUMN otp_requests.business_id IS
  'NULL for login purpose. Required for reward_redemption purpose.';
```

---

## 6.12 `idempotency_keys`

```sql
CREATE TABLE idempotency_keys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key            UUID NOT NULL,
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id    UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  -- Set after successful transaction creation. Used to return cached result on retry.
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT idempotency_keys_key_unique UNIQUE (key)
);

-- This table resolves audit finding API-005 and B-002.
-- The completeVisit() RPC checks this table BEFORE attempting DB writes.
-- If key exists and transaction_id is set → return cached success response.
-- If key exists and transaction_id is NULL → previous attempt failed, allow retry.
-- If key does not exist → insert key, proceed with writes, set transaction_id on success.

-- Retention: Keys older than 24 hours can be purged via scheduled job.

COMMENT ON TABLE idempotency_keys IS
  'Prevents duplicate transaction creation. Key generated per checkout session by client.';
```

---

## 6.13 `notifications`

```sql
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id  UUID REFERENCES customers(id) ON DELETE SET NULL,
  type         notification_type_enum NOT NULL,
  provider     notification_provider_enum NOT NULL DEFAULT 'sms',
  status       notification_status_enum NOT NULL DEFAULT 'pending',
  phone        VARCHAR(15) NOT NULL,        -- Destination phone number (E.164)
  template_id  VARCHAR(100),               -- MSG91 DLT template ID
  error_msg    TEXT,                        -- Populated on failure
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS
  'Log of all outgoing SMS notifications. Fire-and-forget for transaction_confirmation type.';
COMMENT ON COLUMN notifications.template_id IS
  'MSG91 DLT-approved template ID. Required for all Indian SMS.';
```

---

## 6.14 `audit_logs`

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  event       audit_event_enum NOT NULL,
  entity      VARCHAR(50) NOT NULL,      -- Table name: 'transactions', 'catalog_items', etc.
  entity_id   UUID,                      -- The affected record's ID
  old_value   JSONB,                     -- Previous state (for edits)
  new_value   JSONB,                     -- New state (for edits)
  metadata    JSONB,                     -- Additional context
  ip_address  INET,                      -- Requester IP
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  -- APPEND ONLY. Never UPDATE or DELETE.
);

COMMENT ON TABLE audit_logs IS
  'Immutable append-only security and edit audit trail. All defined audit_event_enum values must be logged.';
COMMENT ON COLUMN audit_logs.old_value IS
  'JSON snapshot of field(s) before mutation. Used for TRANSACTION_EDITED events.';
```

---

# 7. Indexes

```sql
-- businesses
CREATE INDEX idx_businesses_status ON businesses(status);

-- users
CREATE UNIQUE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_business_id ON users(business_id);
CREATE INDEX idx_users_phone ON users(phone);

-- customers
CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE UNIQUE INDEX idx_customers_business_phone ON customers(business_id, phone);
CREATE INDEX idx_customers_name ON customers(name) WHERE name IS NOT NULL;
CREATE INDEX idx_customers_last_visit ON customers(business_id, last_visit_at);

-- catalog_items
CREATE INDEX idx_catalog_items_business_id ON catalog_items(business_id);
CREATE INDEX idx_catalog_items_catalog_status ON catalog_items(catalog_id, status);

-- reward_rules
CREATE UNIQUE INDEX idx_reward_rules_business_id ON reward_rules(business_id);

-- reward_wallets
CREATE UNIQUE INDEX idx_reward_wallets_customer_business ON reward_wallets(customer_id, business_id);
CREATE INDEX idx_reward_wallets_business_id ON reward_wallets(business_id);

-- reward_ledger
CREATE INDEX idx_reward_ledger_wallet_id ON reward_ledger(wallet_id);
CREATE INDEX idx_reward_ledger_transaction_id ON reward_ledger(transaction_id);
CREATE INDEX idx_reward_ledger_business_id ON reward_ledger(business_id);

-- transactions
CREATE INDEX idx_transactions_business_created ON transactions(business_id, created_at DESC);
-- Primary query pattern: "get all transactions for business ordered by time"
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_business_customer ON transactions(business_id, customer_id);
CREATE UNIQUE INDEX idx_transactions_idempotency_key ON transactions(idempotency_key);

-- transaction_items
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_business_id ON transaction_items(business_id);

-- otp_requests
CREATE INDEX idx_otp_requests_phone_purpose ON otp_requests(phone, purpose, created_at DESC);
-- Rate limiting query: "how many OTPs sent to this phone for this purpose in last 15 minutes"
CREATE INDEX idx_otp_requests_expires_at ON otp_requests(expires_at);

-- idempotency_keys
CREATE UNIQUE INDEX idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX idx_idempotency_keys_business_customer ON idempotency_keys(business_id, customer_id);

-- notifications
CREATE INDEX idx_notifications_business_id ON notifications(business_id);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status = 'failed';

-- audit_logs
CREATE INDEX idx_audit_logs_business_id ON audit_logs(business_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_event ON audit_logs(event);
```

---

# 8. Row Level Security Policies

> **Implementation Pattern:**
> All RLS policies use the following helper function to get the authenticated user's `business_id`:
>
> ```sql
> CREATE OR REPLACE FUNCTION auth_business_id()
> RETURNS UUID
> LANGUAGE sql STABLE SECURITY DEFINER
> AS $$
>   SELECT business_id FROM users
>   WHERE auth_user_id = auth.uid()
>   AND status = 'active'
>   LIMIT 1;
> $$;
> ```
>
> This function is called in every RLS policy. It is the bridge between Supabase's `auth.uid()` and the application's `business_id`.

```sql
-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- businesses
-- ============================================================
-- Owner can only see and update their own business.
CREATE POLICY businesses_select ON businesses
  FOR SELECT USING (id = auth_business_id());

CREATE POLICY businesses_update ON businesses
  FOR UPDATE USING (id = auth_business_id());

-- No INSERT from client (created via server action in onboarding).
-- No DELETE from client.

-- ============================================================
-- users
-- ============================================================
-- A user can see all users in their own business.
CREATE POLICY users_select ON users
  FOR SELECT USING (business_id = auth_business_id());

CREATE POLICY users_update ON users
  FOR UPDATE USING (business_id = auth_business_id());

-- ============================================================
-- customers
-- ============================================================
CREATE POLICY customers_select ON customers
  FOR SELECT USING (business_id = auth_business_id());

CREATE POLICY customers_insert ON customers
  FOR INSERT WITH CHECK (business_id = auth_business_id());

CREATE POLICY customers_update ON customers
  FOR UPDATE USING (business_id = auth_business_id());

-- ============================================================
-- catalogs
-- ============================================================
CREATE POLICY catalogs_select ON catalogs
  FOR SELECT USING (business_id = auth_business_id());

CREATE POLICY catalogs_insert ON catalogs
  FOR INSERT WITH CHECK (business_id = auth_business_id());

CREATE POLICY catalogs_update ON catalogs
  FOR UPDATE USING (business_id = auth_business_id());

-- ============================================================
-- catalog_items
-- ============================================================
CREATE POLICY catalog_items_select ON catalog_items
  FOR SELECT USING (business_id = auth_business_id());

CREATE POLICY catalog_items_insert ON catalog_items
  FOR INSERT WITH CHECK (business_id = auth_business_id());

CREATE POLICY catalog_items_update ON catalog_items
  FOR UPDATE USING (business_id = auth_business_id());

-- ============================================================
-- reward_rules
-- ============================================================
CREATE POLICY reward_rules_select ON reward_rules
  FOR SELECT USING (business_id = auth_business_id());

CREATE POLICY reward_rules_insert ON reward_rules
  FOR INSERT WITH CHECK (business_id = auth_business_id());

CREATE POLICY reward_rules_update ON reward_rules
  FOR UPDATE USING (business_id = auth_business_id());

-- ============================================================
-- reward_wallets
-- ============================================================
-- Wallet is readable by the business that owns the customer.
CREATE POLICY reward_wallets_select ON reward_wallets
  FOR SELECT USING (business_id = auth_business_id());

-- Wallet is only inserted/updated via server-side RPC (SECURITY DEFINER).
-- No client-side INSERT or UPDATE policy → handled by completeVisit() RPC.

-- ============================================================
-- reward_ledger
-- ============================================================
-- Read through business_id (denormalized).
CREATE POLICY reward_ledger_select ON reward_ledger
  FOR SELECT USING (business_id = auth_business_id());

-- Ledger is only inserted via server-side RPC (SECURITY DEFINER).
-- No client-side INSERT policy.

-- ============================================================
-- transactions
-- ============================================================
CREATE POLICY transactions_select ON transactions
  FOR SELECT USING (business_id = auth_business_id());

CREATE POLICY transactions_update ON transactions
  FOR UPDATE USING (
    business_id = auth_business_id()
    AND now() <= edited_until   -- Only within the 5-minute window
  );
-- Only payment_method column should be changed — enforced at Server Action level.

-- ============================================================
-- transaction_items
-- ============================================================
CREATE POLICY transaction_items_select ON transaction_items
  FOR SELECT USING (business_id = auth_business_id());

-- INSERT only via server-side RPC.

-- ============================================================
-- otp_requests
-- ============================================================
-- No direct client access. All OTP operations go through Server Actions.
-- Service role used for all OTP writes.

-- ============================================================
-- idempotency_keys
-- ============================================================
CREATE POLICY idempotency_keys_select ON idempotency_keys
  FOR SELECT USING (business_id = auth_business_id());

-- INSERT/UPDATE only via server-side RPC.

-- ============================================================
-- notifications
-- ============================================================
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (business_id = auth_business_id());

-- INSERT only via server-side RPC.

-- ============================================================
-- audit_logs
-- ============================================================
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT USING (business_id = auth_business_id());

-- INSERT only via server-side RPC (service role).
```

---

# 9. Entity Relationships

```
businesses (1)
├── users (N) — One owner in MVP, N staff in Phase 2
├── customers (N) — Phone-identified, per-business
│   └── reward_wallets (1 per business) — Balance in paise
│       └── reward_ledger (N) — Append-only history
├── catalogs (1) — One catalog per business
│   └── catalog_items (N) — Services with prices in paise
├── reward_rules (1) — Single reward config record
├── transactions (N) — Completed visits
│   └── transaction_items (N) — Line item snapshots
├── idempotency_keys (N)
├── notifications (N)
└── audit_logs (N) — Security + edit audit trail
```

---

# 10. Migration Order

Execute migrations in this exact order to satisfy foreign key dependencies:

```
001_enums.sql            — All CREATE TYPE statements
002_businesses.sql       — businesses (no FK dependencies)
003_users.sql            — users (FK: businesses)
004_customers.sql        — customers (FK: businesses)
005_catalogs.sql         — catalogs (FK: businesses)
006_catalog_items.sql    — catalog_items (FK: catalogs, businesses)
007_reward_rules.sql     — reward_rules (FK: businesses)
008_reward_wallets.sql   — reward_wallets (FK: customers, businesses)
009_transactions.sql     — transactions (FK: businesses, customers, users)
010_transaction_items.sql— transaction_items (FK: transactions, businesses, catalog_items)
011_reward_ledger.sql    — reward_ledger (FK: reward_wallets, businesses, transactions)
012_otp_requests.sql     — otp_requests (FK: businesses)
013_idempotency_keys.sql — idempotency_keys (FK: businesses, customers, transactions)
014_notifications.sql    — notifications (FK: businesses, customers)
015_audit_logs.sql       — audit_logs (FK: businesses, users)
016_indexes.sql          — All CREATE INDEX statements
017_rls.sql              — auth_business_id() function + all RLS policies
018_rpc_functions.sql    — Supabase RPC functions (see 07_Application_Architecture.md)
019_seed.sql             — Development seed data (see Section 11)
```

---

# 11. Seed Data Specification

> Seed data is for development and staging environments only. Never run against production.

```sql
-- seed.sql

-- Test Business
INSERT INTO businesses (id, name, business_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Salon',
  'salon',
  'active'
);

-- Test Owner (auth_user_id must match a real Supabase Auth test user)
INSERT INTO users (id, business_id, auth_user_id, name, phone, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000099',  -- Replace with Supabase test auth UID
  'Test Owner',
  '+919876543210',
  'owner',
  'active'
);

-- Reward Rules
INSERT INTO reward_rules (business_id, reward_percentage, max_redeem_percentage)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  10,    -- 10% reward
  20     -- 20% max redeem
);

-- Catalog
INSERT INTO catalogs (id, business_id)
VALUES ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001');

-- Catalog Items (prices in paise)
INSERT INTO catalog_items (catalog_id, business_id, type, name, price, status) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'service', 'Haircut', 20000, 'active'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'service', 'Beard', 10000, 'active'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'service', 'Facial', 50000, 'active'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'service', 'Hair Color', 80000, 'active'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'service', 'Hair Spa', 60000, 'active');
-- 20000 paise = ₹200, 10000 = ₹100, etc.

-- Test Customers
INSERT INTO customers (id, business_id, phone, name, total_visits) VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '+919000000001', 'Priya Sharma', 5),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '+919000000002', 'Rahul Verma', 2),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '+919000000003', NULL, 0);
-- Customer 3: new customer (no name, no visits, zero wallet)

-- Reward Wallets
INSERT INTO reward_wallets (customer_id, business_id, current_balance) VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 50000),  -- ₹500 balance
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 10000),  -- ₹100 balance
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 0);      -- New customer, ₹0
```

---

# 12. Audit Column Policy

The following tables require `created_by` (UUID, references users.id):

| Table         | created_by  | updated_by        |
| ------------- | ----------- | ----------------- |
| transactions  | ✅ Required | ❌ (immutable)    |
| catalog_items | ✅ Required | ✅ Required       |
| customers     | ✅ Required | ❌ (auto-updated) |
| reward_rules  | ✅ Required | ✅ Required       |

Financial tables (`reward_ledger`, `transaction_items`) are insert-only and do not require `updated_by`.

The `created_by` value is the `users.id` of the authenticated user performing the operation, passed from the Server Action.

---

# 13. Idempotency Strategy

**Implementation:** `idempotency_keys` table (PostgreSQL) — no Redis required.

**Flow:**

1. Client generates `idempotencyKey = crypto.randomUUID()` when checkout screen mounts.
2. Client includes `idempotencyKey` in the `completeVisit()` RPC payload.
3. Server checks `idempotency_keys` table:
   - **Key exists, transaction_id is set** → Return `{ success: true, transactionId: existing_id }` immediately. No DB writes.
   - **Key exists, transaction_id is NULL** → Previous attempt failed mid-write. Allow retry (proceed with writes).
   - **Key does not exist** → INSERT key record (transaction_id = NULL), proceed with transaction writes, UPDATE key with transaction_id on success.
4. The INSERT in step 3 uses `ON CONFLICT DO NOTHING` to handle race conditions atomically.

**Key lifetime:** 24 hours. A nightly cleanup job can purge keys older than 24 hours.

**Browser refresh behavior:** New page load = new idempotency key = treated as new billing session.

---

# 14. Performance Guidelines

- UUID primary keys (Supabase default)
- All queries filter on `business_id` first (indexed)
- Cursor-based pagination using `created_at` + `id` for transaction lists
- Avoid SELECT * — always specify column list
- Insights queries: `WHERE business_id = $1 AND created_at >= $today_start AND created_at < $today_end`
- Wallet reads use `SELECT FOR UPDATE` inside the `completeVisit()` RPC transaction to prevent race conditions
- Connection pooling: Use Supabase's built-in PgBouncer (Transaction mode)

---

# 15. Backup Strategy

- Supabase automated daily backups (included in Pro plan)
- Point-in-time recovery (PITR) enabled on Pro plan
- Recovery Time Objective (RTO): < 1 hour
- Recovery Point Objective (RPO): < 15 minutes

---

# Document Status

✅ **Approved — Implementation Ready**
🔒 **Locked**

**Version 2.0** — Complete database schema with DDL, constraints, indexes, RLS policies, migration order, and seed data. Resolves audit findings D-001 through D-011, S-001, S-008, and A-004.

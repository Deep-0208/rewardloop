

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


CREATE TABLE catalogs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()

  -- UNIQUE on business_id enforces one catalog per business.
);


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


CREATE OR REPLACE FUNCTION auth_business_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT business_id FROM users
  WHERE auth_user_id = auth.uid()
  AND status = 'active'
  LIMIT 1;
$$;

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

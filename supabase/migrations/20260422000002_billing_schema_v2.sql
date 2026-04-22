-- ============================================================
-- ZiroWork: Billing System v2 Schema Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. subscription_plans ────────────────────────────────────
-- Named plans tied to a location (e.g., "Weekly 30min Guitar - Bellevue")
CREATE TABLE IF NOT EXISTS subscription_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(255) NOT NULL,           -- "Weekly 30min Guitar"
    description     TEXT,
    base_price      DECIMAL(10,2) NOT NULL DEFAULT 0,
    billing_cycle   VARCHAR(50) NOT NULL DEFAULT 'monthly',
    interval_weeks  INTEGER NOT NULL DEFAULT 1,      -- lessons per week
    session_minutes INTEGER NOT NULL DEFAULT 30,     -- lesson length
    location_id     UUID REFERENCES locations(id),
    instrument      VARCHAR(100),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_tenant ON subscription_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_location ON subscription_plans(location_id);

-- ── 2. invoice_items ─────────────────────────────────────────
-- Alias/extension of invoice_line_items with makeup session support
CREATE TABLE IF NOT EXISTS invoice_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    student_id          UUID REFERENCES students(id),
    description         TEXT NOT NULL DEFAULT '',
    quantity            DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price          DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount              DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    is_makeup_session   BOOLEAN NOT NULL DEFAULT FALSE,
    is_fifth_week       BOOLEAN NOT NULL DEFAULT FALSE,  -- auto-flagged 5th-week sessions
    session_date        DATE,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_student ON invoice_items(student_id);

-- ── 3. student_messages ──────────────────────────────────────
-- Student/parent feedback routed to Director, NOT teacher
CREATE TABLE IF NOT EXISTS student_messages (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    student_id              UUID REFERENCES students(id),
    family_id               UUID REFERENCES families(id),
    category                VARCHAR(100) NOT NULL DEFAULT 'General',  -- 'Issue', 'Note', 'General', 'Billing'
    content                 TEXT NOT NULL,
    is_anonymous            BOOLEAN NOT NULL DEFAULT FALSE,
    admin_reviewed          BOOLEAN NOT NULL DEFAULT FALSE,
    forwarded_to_teacher    BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by             UUID,                          -- director user_id who reviewed
    reviewed_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_messages_tenant ON student_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_student_messages_student ON student_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_student_messages_unreviewed ON student_messages(tenant_id, admin_reviewed) WHERE admin_reviewed = FALSE;

-- ── 4. Add missing columns to invoices ───────────────────────
-- theme_preference: 'light' or 'dark' for the live invoice view
-- live_url_token: unique token for the public-facing live invoice URL
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'dark',
    ADD COLUMN IF NOT EXISTS live_url_token   VARCHAR(255),
    ADD COLUMN IF NOT EXISTS location_id      UUID REFERENCES locations(id),
    ADD COLUMN IF NOT EXISTS google_review_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS show_practice_timer   BOOLEAN DEFAULT FALSE;

-- Unique index on live_url_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_live_url_token ON invoices(live_url_token) WHERE live_url_token IS NOT NULL;

-- ── 5. Link subscriptions to subscription_plans ──────────────
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id);

-- ── 6. Row Level Security ─────────────────────────────────────
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_messages ENABLE ROW LEVEL SECURITY;

-- Service role bypass (app uses service role key)
CREATE POLICY IF NOT EXISTS "service_role_all_subscription_plans"
    ON subscription_plans FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_role_all_invoice_items"
    ON invoice_items FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_role_all_student_messages"
    ON student_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Verify: SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('subscription_plans', 'invoice_items', 'student_messages');
-- Should return 3 rows.
-- ============================================================

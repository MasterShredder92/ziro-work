-- ============================================================
-- ZiroWork: Billing System v2 Schema Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. subscription_plans ────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    base_price      DECIMAL(10,2) NOT NULL DEFAULT 0,
    billing_cycle   VARCHAR(50) NOT NULL DEFAULT 'monthly',
    interval_weeks  INTEGER NOT NULL DEFAULT 1,
    session_minutes INTEGER NOT NULL DEFAULT 30,
    location_id     UUID REFERENCES locations(id),
    instrument      VARCHAR(100),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_tenant ON subscription_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_location ON subscription_plans(location_id);

-- ── 2. invoice_items ─────────────────────────────────────────
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
    is_fifth_week       BOOLEAN NOT NULL DEFAULT FALSE,
    session_date        DATE,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_student ON invoice_items(student_id);

-- ── 3. student_messages ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_messages (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    student_id              UUID REFERENCES students(id),
    family_id               UUID REFERENCES families(id),
    category                VARCHAR(100) NOT NULL DEFAULT 'General',
    content                 TEXT NOT NULL,
    is_anonymous            BOOLEAN NOT NULL DEFAULT FALSE,
    admin_reviewed          BOOLEAN NOT NULL DEFAULT FALSE,
    forwarded_to_teacher    BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by             UUID,
    reviewed_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_messages_tenant ON student_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_student_messages_student ON student_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_student_messages_unreviewed
    ON student_messages(tenant_id, admin_reviewed)
    WHERE admin_reviewed = FALSE;

-- ── 4. Add missing columns to invoices ───────────────────────
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS theme_preference        VARCHAR(20) DEFAULT 'dark',
    ADD COLUMN IF NOT EXISTS live_url_token          VARCHAR(255),
    ADD COLUMN IF NOT EXISTS location_id             UUID REFERENCES locations(id),
    ADD COLUMN IF NOT EXISTS google_review_enabled   BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS show_practice_timer     BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_live_url_token
    ON invoices(live_url_token)
    WHERE live_url_token IS NOT NULL;

-- ── 5. Link subscriptions to subscription_plans ──────────────
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id);

-- ── 6. Row Level Security ─────────────────────────────────────
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_messages ENABLE ROW LEVEL SECURITY;

-- Service role bypass (Postgres doesn't support CREATE POLICY IF NOT EXISTS)
DO $$
BEGIN
    -- subscription_plans
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'subscription_plans'
          AND policyname = 'service_role_all_subscription_plans'
    ) THEN
        EXECUTE 'CREATE POLICY "service_role_all_subscription_plans"
            ON subscription_plans FOR ALL TO service_role
            USING (true) WITH CHECK (true)';
    END IF;

    -- invoice_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'invoice_items'
          AND policyname = 'service_role_all_invoice_items'
    ) THEN
        EXECUTE 'CREATE POLICY "service_role_all_invoice_items"
            ON invoice_items FOR ALL TO service_role
            USING (true) WITH CHECK (true)';
    END IF;

    -- student_messages
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'student_messages'
          AND policyname = 'service_role_all_student_messages'
    ) THEN
        EXECUTE 'CREATE POLICY "service_role_all_student_messages"
            ON student_messages FOR ALL TO service_role
            USING (true) WITH CHECK (true)';
    END IF;
END
$$;

-- ============================================================
-- Verify:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('subscription_plans', 'invoice_items', 'student_messages');
-- Should return 3 rows.
-- ============================================================

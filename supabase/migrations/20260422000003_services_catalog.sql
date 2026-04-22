-- ============================================================
-- ZiroWork: Services & Items Catalog
-- Run in Supabase SQL Editor
-- ============================================================

-- ── services_catalog ─────────────────────────────────────────
-- Sellable services (e.g., "Music Session - Guitar")
-- NOT "guitar lessons" — legally a time slot, not a result
CREATE TABLE IF NOT EXISTS services_catalog (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(255) NOT NULL,          -- "Music Session"
    sub_category    VARCHAR(100),                   -- instrument sub-type: "Guitar", "Piano", etc.
    description     TEXT,
    unit_price      DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_label      VARCHAR(50) NOT NULL DEFAULT 'session',  -- "session", "month", "item"
    is_core         BOOLEAN NOT NULL DEFAULT FALSE, -- Core 4: Piano, Guitar, Vocals, Drums
    sort_order      INTEGER NOT NULL DEFAULT 0,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    taxable         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_catalog_tenant ON services_catalog(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_catalog_active ON services_catalog(tenant_id, active);

-- ── Seed Core 4 for Adkins Music Lessons ─────────────────────
-- Only inserts if the tenant has no services yet
DO $$
DECLARE
    tid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM services_catalog WHERE tenant_id = tid) THEN
        INSERT INTO services_catalog (tenant_id, name, sub_category, unit_price, unit_label, is_core, sort_order, active) VALUES
        (tid, 'Music Session', 'Piano',  0.00, 'session', TRUE,  1, TRUE),
        (tid, 'Music Session', 'Guitar', 0.00, 'session', TRUE,  2, TRUE),
        (tid, 'Music Session', 'Vocals', 0.00, 'session', TRUE,  3, TRUE),
        (tid, 'Music Session', 'Drums',  0.00, 'session', TRUE,  4, TRUE);
    END IF;
END
$$;

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE services_catalog ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'services_catalog'
          AND policyname = 'service_role_all_services_catalog'
    ) THEN
        EXECUTE 'CREATE POLICY "service_role_all_services_catalog"
            ON services_catalog FOR ALL TO service_role
            USING (true) WITH CHECK (true)';
    END IF;
END
$$;

-- ============================================================
-- Verify:
-- SELECT id, name, sub_category, is_core, sort_order
-- FROM services_catalog
-- WHERE tenant_id = ''00000000-0000-0000-0000-000000000001''
-- ORDER BY sort_order;
-- ============================================================

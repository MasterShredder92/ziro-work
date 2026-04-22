-- ============================================================
-- ZiroWork: Add recurring billing columns to invoices
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS is_recurring         BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS recurring_day         INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS next_invoice_date     DATE,
    ADD COLUMN IF NOT EXISTS parent_invoice_id     UUID REFERENCES invoices(id),
    ADD COLUMN IF NOT EXISTS invoice_month         VARCHAR(7);  -- e.g. "2026-05"

-- Index for recurring invoice generation job
CREATE INDEX IF NOT EXISTS idx_invoices_recurring
    ON invoices(tenant_id, is_recurring, next_invoice_date)
    WHERE is_recurring = TRUE AND status NOT IN ('void', 'cancelled');

-- ============================================================
-- Verify:
-- SELECT id, is_recurring, recurring_day, next_invoice_date
-- FROM invoices LIMIT 5;
-- ============================================================

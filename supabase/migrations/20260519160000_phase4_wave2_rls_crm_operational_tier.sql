-- Phase 4 Wave 2: CRM & Operational Tier RLS Hardening
-- 2026-05-19
--
-- Applies tenant_isolation policies to 5 tables that had RLS enabled but no
-- isolation policy. Uses the canonical session-variable pattern established in
-- Wave 1: current_setting('app.tenant_id'::text, true).
--
-- Tables with existing tenant_access policies are intentionally left untouched:
--   families, students, teachers    (text tenant_id, current_tenant_id() pattern)
--   locations, schedule_blocks      (uuid tenant_id, current_tenant_id() pattern)
--
-- Tables skipped — no tenant_id column in schema:
--   contacts (platform-level lead table), family_members, lesson_rates, studios
--   (last three do not exist in public schema as of this migration)
--
-- Special case: tenants table uses id (not tenant_id) as the isolation key.

-- ── Ensure RLS is on (idempotent safety net) ──────────────────────────────────

ALTER TABLE public.notes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants          ENABLE ROW LEVEL SECURITY;

-- ── TEXT tenant_id ────────────────────────────────────────────────────────────

-- notes.tenant_id :: text
CREATE POLICY tenant_isolation ON public.notes
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

-- ── UUID tenant_id ────────────────────────────────────────────────────────────

-- activity_log.tenant_id :: uuid
CREATE POLICY tenant_isolation ON public.activity_log
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

-- recurring_lessons.tenant_id :: uuid
CREATE POLICY tenant_isolation ON public.recurring_lessons
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

-- session_log.tenant_id :: uuid
CREATE POLICY tenant_isolation ON public.session_log
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

-- ── SPECIAL CASE: tenants table ───────────────────────────────────────────────
-- tenants.id :: text — this IS the tenant identifier; no tenant_id FK column.
-- An authenticated client may only read/write its own tenant row.

CREATE POLICY tenant_isolation ON public.tenants
  FOR ALL TO authenticated
  USING (id = current_setting('app.tenant_id'::text, true));

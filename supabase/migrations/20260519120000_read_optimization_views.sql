-- =============================================================================
-- READ OPTIMIZATION VIEWS — Phase 2
-- 2026-05-19
--
-- Five views replace heavy in-repo data fetching and JS aggregation:
--   1. view_student_profiles       — students.* + age_years computed integer
--   2. view_schedule_blocks_extended — schedule_blocks.* + is_checked_in
--   3. view_family_account_summary  — invoice aggregates per family
--   4. view_tenant_billing_aging    — aging buckets per tenant (multi-row)
--   5. view_student_lifecycle_context — single-row JOIN replacing 6 queries
--                                       in buildContext.ts
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. view_student_profiles
--    Adds age_years (integer) computed from date_of_birth.
--    The students.age column is a legacy text field; age_years is the computed
--    integer form.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_student_profiles AS
SELECT
  s.*,
  CASE
    WHEN s.date_of_birth IS NOT NULL
      THEN DATE_PART('year', AGE(s.date_of_birth))::integer
    ELSE NULL
  END AS age_years
FROM public.students s;


-- -----------------------------------------------------------------------------
-- 2. view_schedule_blocks_extended
--    Adds is_checked_in computed from checked_in_at IS NOT NULL.
--    schedule_blocks.checked_in is a persisted boolean that may be stale;
--    is_checked_in is the authoritative computed version.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_schedule_blocks_extended AS
SELECT
  sb.*,
  (sb.checked_in_at IS NOT NULL) AS is_checked_in
FROM public.schedule_blocks sb;


-- -----------------------------------------------------------------------------
-- 3. view_family_account_summary
--    Replaces 3-query JS aggregation in billing/balance.ts::computeFamilyBalance.
--    Denormalized balance columns on families (lifetime_paid_cents,
--    overdue_balance_cents) are NOT authoritative — invoices table is.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_family_account_summary AS
SELECT
  f.id                                                                      AS family_id,
  f.tenant_id,
  f.name,
  f.primary_email,
  f.primary_phone,
  f.primary_location_id,
  COALESCE(
    SUM(CASE WHEN i.status NOT IN ('void', 'paid') THEN i.balance_cents ELSE 0 END),
    0
  )::bigint                                                                 AS outstanding_cents,
  COALESCE(SUM(i.amount_paid_cents), 0)::bigint                            AS paid_cents,
  0::bigint                                                                 AS credit_balance_cents,
  COALESCE(
    COUNT(CASE WHEN i.status NOT IN ('void', 'paid') THEN 1 END),
    0
  )::integer                                                                AS open_invoice_count,
  COALESCE(
    COUNT(
      CASE
        WHEN i.status NOT IN ('void', 'paid')
          AND i.due_at IS NOT NULL
          AND i.paid_at IS NULL
          AND i.due_at < NOW()
        THEN 1
      END
    ),
    0
  )::integer                                                                AS overdue_invoice_count
FROM public.families f
LEFT JOIN public.invoices i
  ON i.family_id = f.id
  AND i.tenant_id = f.tenant_id
GROUP BY
  f.id,
  f.tenant_id,
  f.name,
  f.primary_email,
  f.primary_phone,
  f.primary_location_id;


-- -----------------------------------------------------------------------------
-- 4. view_tenant_billing_aging
--    Replaces JS in-memory bucketing in billing/balance.ts::computeTenantAging.
--    Returns one row per (tenant_id, bucket_id) — query with .eq('tenant_id').
--    Bucket labels mirror the TypeScript AGING_SPECS constants exactly.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_tenant_billing_aging AS
SELECT
  i.tenant_id,
  CASE
    WHEN i.due_at IS NULL OR i.due_at >= NOW()                          THEN 'current'
    WHEN EXTRACT(EPOCH FROM (NOW() - i.due_at)) / 86400.0 <= 30        THEN '0-30'
    WHEN EXTRACT(EPOCH FROM (NOW() - i.due_at)) / 86400.0 <= 60        THEN '31-60'
    WHEN EXTRACT(EPOCH FROM (NOW() - i.due_at)) / 86400.0 <= 90        THEN '61-90'
    ELSE                                                                     '90+'
  END                                                                     AS bucket_id,
  CASE
    WHEN i.due_at IS NULL OR i.due_at >= NOW()                          THEN 'Current'
    WHEN EXTRACT(EPOCH FROM (NOW() - i.due_at)) / 86400.0 <= 30        THEN '1 – 30 days'
    WHEN EXTRACT(EPOCH FROM (NOW() - i.due_at)) / 86400.0 <= 60        THEN '31 – 60 days'
    WHEN EXTRACT(EPOCH FROM (NOW() - i.due_at)) / 86400.0 <= 90        THEN '61 – 90 days'
    ELSE                                                                     '90+ days'
  END                                                                     AS bucket_label,
  COUNT(*)::integer                                                       AS invoice_count,
  SUM(i.balance_cents)::bigint                                            AS outstanding_cents
FROM public.invoices i
WHERE i.status NOT IN ('void', 'paid')
  AND i.balance_cents > 0
GROUP BY
  i.tenant_id,
  bucket_id,
  bucket_label;


-- -----------------------------------------------------------------------------
-- 5. view_student_lifecycle_context
--    Replaces the 6-query fetch in buildContext.ts with a single row.
--
--    stage_events: only event_type = 'student_stage_changed' rows (last 20).
--    This is all that emitStageTransition needs from ctx.events.
--
--    invoices[] and attendance[] raw arrays are empty in the refactored
--    buildContext.ts — their signals are computed here.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_student_lifecycle_context AS
SELECT
  s.id                                                                      AS student_id,
  s.tenant_id,

  -- Full records as JSONB for TypeScript field access in stages.ts
  to_jsonb(s)                                                               AS student,
  CASE WHEN l.id IS NOT NULL THEN to_jsonb(l) ELSE NULL END                AS lead,
  CASE WHEN t_row.id IS NOT NULL THEN to_jsonb(t_row) ELSE NULL END        AS trial,

  -- Stage-change events for emitStageTransition (scoped: only what it reads)
  COALESCE(
    (
      SELECT jsonb_agg(e ORDER BY e.created_at DESC)
      FROM (
        SELECT *
        FROM public.events ev
        WHERE ev.entity_id = s.id
          AND ev.entity_type = 'student'
          AND ev.event_type = 'student_stage_changed'
        ORDER BY ev.created_at DESC
        LIMIT 20
      ) e
    ),
    '[]'::jsonb
  )                                                                         AS stage_events,

  -- Enrollment / assignment flags
  (s.teacher_id IS NOT NULL)                                               AS teacher_assigned,

  (
    s.enrollment_date IS NOT NULL
    OR s.start_date IS NOT NULL
    OR s.first_lesson_date IS NOT NULL
    OR LOWER(COALESCE(s.status, '')) IN ('active', 'enrolled')
  )                                                                         AS enrolled,

  (
    EXISTS (
      SELECT 1 FROM public.attendance a
      WHERE a.student_id = s.id
        AND a.tenant_id = s.tenant_id
      LIMIT 1
    )
    OR COALESCE(s.total_lessons_taken, 0) > 0
    OR s.first_lesson_date IS NOT NULL
    OR s.start_date IS NOT NULL
  )                                                                         AS service_started,

  -- Scheduled: trial active, or teacher assigned with lesson cadence
  (
    COALESCE(t_row.status, '') IN ('scheduled', 'confirmed')
    OR (t_row.scheduled_at IS NOT NULL AND t_row.scheduled_at > NOW())
    OR (
      s.teacher_id IS NOT NULL
      AND (
        s.lesson_day_of_week IS NOT NULL
        OR COALESCE(s.blocks_per_week, 0) > 0
      )
    )
  )                                                                         AS scheduled,

  -- Risk signals (replaces 3 JS filter passes over raw arrays)
  COALESCE(
    (
      SELECT COUNT(*)::integer
      FROM public.attendance a
      WHERE a.student_id = s.id
        AND a.tenant_id = s.tenant_id
        AND a.present = false
        AND a.lesson_date >= (NOW() - INTERVAL '30 days')
        AND a.lesson_date <= NOW()
    ),
    0
  )                                                                         AS missed_lessons_30d,

  COALESCE(
    (
      SELECT COUNT(*)::integer
      FROM public.invoices i
      WHERE i.student_id = s.id
        AND i.tenant_id = s.tenant_id
        AND i.status NOT IN ('void', 'paid')
        AND i.due_at IS NOT NULL
        AND i.paid_at IS NULL
        AND i.due_at < NOW()
    ),
    0
  )                                                                         AS overdue_invoices,

  COALESCE(
    (
      SELECT COUNT(*)::integer
      FROM public.events ev
      WHERE ev.entity_id = s.id
        AND ev.entity_type = 'student'
        AND ev.created_at >= (NOW() - INTERVAL '30 days')
        AND (
          ev.event_type LIKE '%complaint%'
          OR ev.event_type LIKE '%refund%'
          OR ev.event_type LIKE '%cancel%'
          OR ev.event_type LIKE '%churn%'
          OR ev.event_type LIKE '%chargeback%'
          OR ev.event_type LIKE 'negative_%'
        )
    ),
    0
  )                                                                         AS negative_events_30d,

  -- Last activity date as text; inactivityDays is computed in TS from this
  COALESCE(
    s.last_attendance_at::text,
    (
      SELECT a.lesson_date::text
      FROM public.attendance a
      WHERE a.student_id = s.id
        AND a.tenant_id = s.tenant_id
      ORDER BY a.lesson_date DESC
      LIMIT 1
    ),
    s.start_date::text
  )                                                                         AS last_activity_date

FROM public.students s

LEFT JOIN public.leads l
  ON l.id = s.lead_id
  AND l.tenant_id = s.tenant_id

LEFT JOIN LATERAL (
  SELECT t.*
  FROM public.trials t
  WHERE t.lead_id = s.lead_id
    AND t.tenant_id = s.tenant_id
  ORDER BY t.scheduled_at DESC
  LIMIT 1
) t_row ON s.lead_id IS NOT NULL;

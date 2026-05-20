# Session Log

## 2026-05-19 — Phase 3: Write Optimization (APPLIED TO LIVE)

**Commits:** Phase 1 (1ea5100), Phase 2 (f28ffa3) locked before this session.

**Pre-flight patches required before live apply:**
1. `students.start_date` / `first_lesson_date` — confirmed `date` type; removed `::text` casts in `enroll_student` RPC
2. `recurring_lessons` unique constraint — confirmed index includes `tenant_id`; updated `ON CONFLICT` from `(student_id, teacher_id, location_id, day_of_week, start_time)` to `(tenant_id, student_id, teacher_id, location_id, day_of_week, start_time)`
3. `activity_log.details` — confirmed `text` type; `::text` cast on `jsonb_build_object()` is correct, no change needed

**Changed (local — pending commit):**
- `supabase/migrations/20260519130000_write_optimization_triggers_rpcs.sql` — patched ON CONFLICT + removed ::text casts
- `src/lib/crm/studentLifecycle.ts` — 82 → 55 lines; removed LEGAL_NEXT, canTransition, transition guard
- `src/app/api/schedule-blocks/book-session/route.ts` — 177 → 83 lines; RPC delegate + VALIDATION_PREFIXES error classifier (400 vs 500)
- `src/lib/crm/enrollmentEngine.ts` — 94 → 78 lines; enrollStudent delegates to enroll_student RPC
- `src/lib/crm/index.ts` — removed canStudentTransition re-export

**Applied to live DB (gngbyydqjouxkoprzzil):**
- `trg_enforce_student_stage_transitions` — BEFORE UPDATE on students ✓
- `trg_handle_session_completion` — AFTER UPDATE on schedule_blocks ✓
- `trg_validate_session_log_matches_block` — BEFORE INSERT/UPDATE on session_log ✓
- `book_session(...)` RPC — SECURITY DEFINER ✓
- `enroll_student(...)` RPC — SECURITY DEFINER ✓

**Phase 4 RLS landscape (as of 2026-05-19):**
- All tenant tables have `rowsecurity = true`
- 14 tables have at least 1 policy; ~90+ have 0 policies (enabled but no pass-through)
- Service role bypasses RLS; isolation is app-layer only until Phase 4 applies

## 2026-05-19 — Phase 4 Wave 1: Financial Tier RLS Hardening (APPLIED TO LIVE)

**Commit:** 49b3e78

**Pre-flight audit findings:**
1. `tenant_id` column type is MIXED across financial tables — 15 tables use `text`, 7 use `uuid`
2. Existing `tenant_isolation` policies use `current_setting('app.tenant_id'::text, true)` — session variable, NOT JWT claims
3. JWT claims approach (Zach's guardrail) would have failed: `tenant_id` is in `app_metadata` not top-level, AND text/uuid mismatch would block all rows
4. One pre-existing policy on `invoice_items` (`service_role_all_invoice_items`, scoped to `{service_role}`) — dropped as dead weight
5. `get_my_tenant_id()` function approach abandoned in favor of inline session variable (matches codebase standard)

**Applied to live DB (gngbyydqjouxkoprzzil):**
- 15 text tables: `payments`, `invoices`, `invoice_line_items`, `billing_cycles`, `billing_plans`, `billing_settings`, `credits`, `discounts`, `subscriptions`, `subscription_items`, `usage_records`, `square_invoices`, `square_invoices_fact`, `square_payments_fact`, `stripe_customers` — `USING (tenant_id = current_setting('app.tenant_id'::text, true))` ✓
- 7 uuid tables: `billing_adjustments`, `billing_events`, `billing_periods`, `invoice_flags`, `invoice_items`, `invoice_tokens`, `square_refunds_fact` — `USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid)` ✓
- All 22 confirmed via `pg_policies` post-apply

**Architecture note:** All server-side billing access uses `getServiceClient()` (service_role, RLS bypass). Phase 4 policies protect future authenticated-client or direct PostgREST access paths.

## 2026-05-19 — Phase 4 Wave 2: CRM & Operational Tier RLS Hardening (APPLIED TO LIVE)

**Commit:** pending

**Pre-flight audit findings:**
1. 5 tables had RLS enabled but zero policies — needed new `tenant_isolation` policies
2. 5 tables had existing `tenant_access` policies (families, students, teachers, locations, schedule_blocks) using `current_tenant_id()` function (profiles-based lookup via auth.uid()) — preserved as-is per guardrail
3. `current_tenant_id()` function body: `SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1` — valid isolation pattern, different from session-variable but not contradictory
4. `contacts` table has no `tenant_id` column — platform-level lead table; skipped
5. `family_members`, `lesson_rates`, `studios` tables do not exist in public schema — skipped
6. `tenants` table uses `id` (text) not `tenant_id` as the isolation key — special-cased with `USING (id = current_setting('app.tenant_id'::text, true))`

**Applied to live DB (gngbyydqjouxkoprzzil):**
- `notes` (text tenant_id): `USING (tenant_id = current_setting('app.tenant_id'::text, true))` ✓
- `activity_log` (uuid tenant_id): `USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid)` ✓
- `recurring_lessons` (uuid tenant_id): `USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid)` ✓
- `session_log` (uuid tenant_id): `USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid)` ✓
- `tenants` (id :: text): `USING (id = current_setting('app.tenant_id'::text, true))` ✓
- All 5 confirmed via `pg_policies` post-apply

**Preserved (no touch):**
- `families`, `students`, `teachers` — existing `tenant_access` (text, current_tenant_id()::text)
- `locations` — existing `tenant_access` (uuid, current_tenant_id()) + public SELECT read
- `schedule_blocks` — existing `tenant_access` (uuid, current_tenant_id())

**schema.sql note:** Contains only CREATE TABLE definitions; RLS policies are not tracked there. Wave 2 added no table structure changes — schema.sql remains accurate. Migration file is the source of truth for policy changes.

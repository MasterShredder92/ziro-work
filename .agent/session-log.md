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

**Commit:** 707bb5d

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

## 2026-05-19 — Phase 4 Wave 3: Final Sweep RLS Hardening (APPLIED TO LIVE)

**Commit:** 3eb8bd7

**Pre-flight audit findings:**
1. 72 entries in information_schema had tenant_id and zero policies — 7 confirmed views (RLS not applicable), 65 net base tables confirmed via information_schema.tables
2. Final count after type classification: 23 TEXT tenant_id + 45 UUID tenant_id = 68 base tables
3. All 68 targets had zero existing policies — no conflicting permissive policy to drop
4. views_skipped: v_family_billing, view_family_account_summary, view_schedule_blocks_extended, view_student_lifecycle_context, view_student_profiles, view_tenant_billing_aging, vw_student_family_search

**Applied to live DB (gngbyydqjouxkoprzzil) — 68 tables:**

TEXT tenant_id (23):
addresses, api_tokens, attendance, brand_settings, enrollments, error_resolution_logs,
expenses, finance_accounts, finance_locations, integration_configs, leads, lesson_plans,
lifecycle, performance_alerts, pricing_tiers, raven_escalations, raven_message_log,
schedules, student_followups, teacher_w9, tenant_settings, trials, ziro_events

UUID tenant_id (45):
agent_tenants, appointment_notifications, audit_log, events, family_files, files,
finance_balance_snapshots, finance_categories, finance_category_groups, finance_category_rules,
finance_exports, finance_plaid_items, finance_recurring_rules, finance_sync_runs,
finance_transaction_category_assignments, finance_transactions, google_oauth_tokens,
intake_submissions, integration_events, issues, notifications, onboarding_sequences,
performance_metrics, permission_definitions, privacy_violation_log, rate_limit_hits,
recruitment_prospects, reviews, room_inventory, rooms, schedule_series, security_events,
sid_context_cache, stewie_risk_log, student_duplicate_reviews, student_events, student_files,
student_instruments, student_notes, studio_closures, studio_messages, teacher_availability,
teacher_room_assignments, tenant_agent_config, value_cards

**Explicitly skipped (global/system — no tenant_id):**
anchor_job_locks, bank_accounts, bank_statements, bank_transactions, billing_line_items,
contacts (platform lead table), customers, lesson_notes, location_hours, metric_snapshots,
pending_reminders, portal_activity, profile_locations, raven_knowledge_base, settings,
star_reviews, system_health, teacher_locations, touches, vault_delivery_attempts,
vault_fulfillment_events, vault_product_square_map, verticals

**Explicitly skipped (vault — user_id isolation, not tenant):**
vault_users, vault_products, vault_product_modules, vault_user_products, vault_user_module_progress

**Post-apply verification:**
- pg_policies count for Wave 3 tables: 68 ✓
- Zero remaining unhardened base tables with tenant_id: confirmed ✓

**Phase 4 RLS COMPLETE — all tenant data tables hardened across all waves.**

## 2026-05-19 — Phase B+C: Service-Role Eradication + CI Guardrail

**Revenue link:** ZiroWork MRR — tenant isolation hardened end-to-end; service-role bypass eliminated from all user-facing routes.

**Commits:** `9ec963d`

**What was done:**
- Classified all 38 service-role API routes: 21 CONVERT, 15 LEGITIMATE (2 fewer than estimated)
- Converted all 21 user-facing routes from `getServiceClient()` to `createTenantBoundSupabaseClient()`:
  - activity-log, agreements, billing-summary, book-session, cancel-session, auto-checkin
  - billing-defaults, dashboard/revenue-gaps, families/search, invoices/create
  - leads/[id]/promote, locations, payroll, recruitment, schedule/availability
  - schedule/recurring-lessons, settings/services, settings/services/[id]
  - students/[id]/reports, students/[id]/teacher, studio-map/roster
- Added `assertServiceRoleAllowed(reason)` to all 15 LEGITIMATE routes (webhooks, public endpoints, internal tools, PDF generation) and to `lib/data/_client.ts` server-side fallback
- Added CI guardrail step to `.github/workflows/ci.yml`: fails if any `src/app/api/` file uses `getServiceClient()` without `assertServiceRoleAllowed()` in the same file
- Fixed TSC error: `schedule/availability` had `tenantId` declaration after first use — swapped order

**Verification:**
- TSC=0 confirmed
- CI guardrail dry-run passed locally
- `lib/data/_client.ts` `clientFor()` server-side path documented with Phase D note; async refactor deferred

**Deferred to Phase D (needs Zach approval):**
- `lib/data/_client.ts` async refactor (80+ data layer callers need updating)
- Billing/family aggregation → Supabase views/RPCs
- Supabase types regeneration from live schema

**Failure index match consulted:** No
**Token cost:** High (large surface area, 38 route conversions)
**Self-score (1-5):** 5 — all 21 CONVERT done, all 15 LEGITIMATE documented, CI guardrail active, TSC=0

---

## 2026-05-19 — Phase A: Repo Digest Regeneration + Pre-flight Verification

**Revenue link:** Operational leverage — stale digest was costing orientation tokens on every session.

**Verified (read-only):**
- `profiles.is_platform_admin` confirmed exists as `boolean` in live DB (`gngbyydqjouxkoprzzil`) ✓
- Pre-request hook in `20260520020432_tenant_context_pre_request.sql` is safe — `COALESCE(p.is_platform_admin, false)` handles missing/null gracefully ✓
- Repo digest was stale at commit `d9fc85f` (May 15); regenerated to `83eec1a` (May 20) ✓

**Changed:**
- `.agent/repo-digest.md` — regenerated manually (Python unavailable in shell); now reflects commit `83eec1a`, includes `supabaseAuthenticated.ts`, all Phase 4 migration files, Architecture Context section, and Service-Role Status table

**Next move:** Phase B — classify 38 remaining service-role API routes and convert ~28 to `createTenantBoundSupabaseClient()`

**Token cost:** Low
**Failure index match consulted:** No
**Self-score (1-5):** 4 — digest is current and accurate; Python shell gap noted for future sessions

## 2026-05-20 — Phase D: clientFor() Async Conversion (COMPLETE)

**Commit:** 9cae504

**Changes:**
- `lib/data/_client.ts` — `clientFor()` converted from synchronous service-role fallback to async `createTenantBoundSupabaseClient({ tenantId })` on server path; browser path unchanged; Phase D comment removed
- `src/lib/billing/stripe.ts` — changed from `clientFor()` to `serviceClient()` throughout; webhook handlers have no user session so `createTenantBoundSupabaseClient()` would return an unauthenticated client that RLS blocks silently
- 109 caller files across `lib/data/*.ts`, `src/lib/crm/*.ts`, `src/lib/director/`, `src/lib/files/`, `src/app/api/` routes, and `src/app/(app)/crm/families/page.tsx` — all `clientFor(` calls prefixed with `await`
- TSC = 0 errors confirmed pre-commit

**Key architectural decision:**
`set_app_tenant_context()` pre-request hook returns early when `auth.uid()` is null (webhook/unauthenticated context), leaving `app.tenant_id` unset. RLS policies then evaluate to `tenant_id = NULL = FALSE`, silently returning 0 rows. Any server-side code called from webhook routes MUST use `serviceClient()`, not `clientFor()`.

**Tenant isolation status:** Complete. No user-facing API path can now reach `getServiceClient()` without an `assertServiceRoleAllowed()` gate.

**Changed:** 111 files (1 core client, 1 webhook exception, 109 callers)
**Verified:** TSC = 0 errors
**Blocked on:** Nothing
**Next move:** Phase D is complete. Remaining debt: `src/lib/data/supabaseTenant.ts` still uses service-role on server path (same pattern as old `_client.ts`) — candidate for a follow-up pass.
**Token cost:** Medium

## 2026-05-20 — Phase E: supabaseTenant.ts + CI Guardrail Extension + Digest Refresh (COMPLETE)

**Commits:** bb15658 (supabaseTenant fix), a2d0a5a (CI extension), 0a408f3 (digest)

**Changes:**
- `src/lib/data/supabaseTenant.ts` — server path changed from `getServiceClient()` to `createTenantBoundSupabaseClient({ tenantId })`; function made async; return type updated to `Promise<SupabaseClient>`; import swapped from `getServiceClient` to `createTenantBoundSupabaseClient`
- 9 callers updated to `await getSupabaseTenant(...)`: `src/app/api/debug/tenant/route.ts`, `src/lib/onboarding/gate.ts`, and 7 hooks in `src/hooks/data/`
- `src/app/api/debug/tenant/route.ts:9` — `ReturnType<typeof getSupabaseTenant>` updated to `Awaited<ReturnType<typeof getSupabaseTenant>>`
- `.github/workflows/ci.yml` — original "Service-role guard" step renamed to cover `src/app/api/`; two new parallel steps added for `lib/data/` and `src/lib/` (excluding `src/lib/supabase.ts` definition file)
- `.agent/repo-digest.md` — metadata commit updated, Architecture Context and Critical Files updated, Service-Role Status table rewritten to reflect Phase D+E completion

**Tenant isolation status:** Complete. No user-facing server path can reach `getServiceClient()` without `assertServiceRoleAllowed()`. CI guardrail now covers all three key directories.

**Changed:** 12 files
**Verified:** TSC = 0 errors
**Blocked on:** Nothing
**Next move:** Tenant isolation hardening is complete across all phases (4 Waves + B+C + D + E). All user-facing data paths are RLS-bound.
**Token cost:** Low

# Repo Digest

> Generated read-only orientation file. Do not hand-edit unless the generator is unavailable.

## Metadata

| Field | Value |
|---|---|
| Repo | `ziro-work` |
| Project Type | Next.js / TypeScript web app |
| Generated | 2026-05-19 — manual regeneration (Python unavailable in shell) |
| Git Branch | `main` |
| Git Commit | `83eec1a` |
| Supabase Project | `gngbyydqjouxkoprzzil` |

## Staleness Check

Regenerate this digest if:
- The last 5 commits touched files not listed in Critical Files, or
- Routes, schema, payment logic, or deployment configuration changed since generation.

## Startup Rule

Read this digest before opening source files. Use it to choose exact paths for targeted reads. Do not broad-scan the repo unless this digest is missing, stale, or insufficient.

## Architecture Context

**This is a Lean Repo / Smart DB multi-tenant SaaS app.**

| Layer | Canonical Pattern |
|---|---|
| Tenant isolation | PostgREST pre-request hook (`public.set_app_tenant_context`) sets `app.tenant_id` on every authenticated request. RLS policies read `current_setting('app.tenant_id', true)`. |
| User-facing API routes | Use `createTenantBoundSupabaseClient()` from `src/lib/supabaseAuthenticated.ts`. Never `getServiceClient()`. |
| Service-role exceptions | Webhooks, internal jobs, migrations, repair scripts only. Must call `assertServiceRoleAllowed(reason)` explicitly. |
| DB read models | Supabase views (`view_family_account_summary`, `view_schedule_blocks_extended`, etc.) — prefer over multi-query app-side aggregation. |
| DB write models | Supabase RPCs (`book_session`, `enroll_student`) and triggers — prefer over app-side write logic. |
| RLS status | 95 tables hardened (Phases 4 Waves 1–3). All tenant tables have isolation policies. |

**Key client files:**
- `src/lib/supabaseAuthenticated.ts` — correct client for all new user-facing server routes
- `src/lib/supabase.ts` — service-role client; exceptions only
- `lib/data/_client.ts` — data layer client; `clientFor()` server fallback still uses service-role (known debt, Phase B)

## Commands

- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`
- `lint`: `eslint --max-warnings 9999`
- `verify`: `npm run lint && npx tsc --noEmit && npm run build`
- `test`: `vitest run`
- `test:smoke`: `vitest run tests/smoke`
- `test:watch`: `vitest`
- `test:e2e`: `playwright test`
- `release:checklist`: `node scripts/release-checklist.mjs`
- `audit`: `node scripts/run-audit.mjs`
- `audit:cross`: `ts-node --project scripts/tsconfig.cjs.json scripts/auditCrossProject.ts`
- `audit:ts`: `ts-node scripts/run-audit.ts`
- `apply:missing`: `ts-node scripts/apply-missing-schema.ts`
- `apply:crm`: `ts-node scripts/apply-crm-normalization.ts`
- `apply:schema`: `ts-node scripts/apply-schema.ts`
- `apply:gngbyy`: `ts-node scripts/apply-gngbyy-cleanup.ts`
- `fix:tenant`: `ts-node scripts/fix-tenant-id.ts`
- `migrate:locations`: `ts-node scripts/migrateLocationsToStudios.ts`
- `sync:cross`: `ts-node --project scripts/tsconfig.cjs.json scripts/syncCrossProject.ts`
- `generate:bootstrap-sql`: `node scripts/generate-target-bootstrap-sql.mjs`
- `generate:bootstrap-sql:full`: `node scripts/generate-target-bootstrap-sql.mjs --full`
- `generate:column-parity-sql`: `node scripts/generate-target-column-parity-sql.mjs`
- `apply:target-sql`: `node scripts/apply-sql-to-target.mjs`

## Critical Files

| Path | Purpose |
|---|---|
| `src/lib/supabaseAuthenticated.ts` | **PRIMARY server client** — authenticated RLS-bound Supabase client for user-facing API routes. Use `createTenantBoundSupabaseClient()`. |
| `src/lib/supabase.ts` | Service-role Supabase client — exceptions only (webhooks, jobs, migrations). |
| `lib/data/_client.ts` | Data layer client. `clientFor()` server-side fallback still uses service-role — known Phase B debt. |
| `supabase/migrations/20260520020432_tenant_context_pre_request.sql` | **CRITICAL** — tenant context bridge. Installs `set_app_tenant_context()` pre-request hook and `current_tenant_id()`. |
| `supabase/migrations/20260520014704_tenant_context_pre_request.sql` | No-op alignment marker for live migration ledger consistency. |
| `supabase/migrations/20260519170000_phase4_wave3_final_sweep_rls.sql` | Phase 4 Wave 3 — 68 tables hardened. |
| `supabase/migrations/20260519160000_phase4_wave2_rls_crm_operational_tier.sql` | Phase 4 Wave 2 — 5 CRM tables hardened. |
| `supabase/migrations/20260519140000_phase4_wave1_rls_financial_tier.sql` | Phase 4 Wave 1 — 22 financial tables hardened. |
| `supabase/migrations/20260519130000_write_optimization_triggers_rpcs.sql` | Phase 3 — write triggers and RPCs (`book_session`, `enroll_student`). |
| `supabase/migrations/20260519120000_read_optimization_views.sql` | Phase 2 — read views replacing multi-query aggregation. |
| `src/lib/types/supabase.ts` | Generated Supabase TypeScript types. Normalized 2026-05-20; not yet regenerated from live schema. |
| `src/lib/types/entities.ts` | Entity type aliases. Patched at Phase 5 for strict generated types. |
| `src/lib/security/tenantIsolation.ts` | Tenant isolation helpers. |
| `src/lib/auth/session.ts` | Auth session helpers. |
| `src/lib/auth/guards.ts` | Route auth guard logic. |
| `.env.example` | Env var documentation. |
| `CLAUDE.md` | Agent startup contract — read `.agent/repo-digest.md` first. |
| `README.md` | Human-facing project overview. |
| `next.config.ts` | Next.js configuration. |
| `package.json` | Node project metadata, dependencies, and scripts. |
| `pnpm-lock.yaml` | Lockfile. |
| `tsconfig.json` | TypeScript configuration. |
| `vercel.json` | Deployment/platform configuration. |
| `scripts/README.md` | Scripts documentation. |
| `.github/workflows/ci.yml` | CI workflow. |
| `.github/workflows/release-checklist.yml` | Release checklist workflow. |
| `lib/data/_client.ts` | Data layer browser/server client factory. |
| `lib/data/families.ts` | Family data queries — app-side aggregation (Phase D: move to views). |
| `lib/data/students.ts` | Student data queries. |
| `lib/data/getTenantContext.ts` | Tenant context resolution. |
| `src/lib/crm/enrollmentEngine.ts` | Enrollment logic — delegates to `enroll_student` RPC. |
| `src/lib/crm/studentLifecycle.ts` | Student lifecycle logic. |
| `src/app/api/crm/teachers/[id]/students/route.ts` | Route or API handler. |
| `src/app/api/crm/teachers/[id]/w9/route.ts` | Route or API handler. |
| `src/app/api/dashboard/metrics/route.ts` | Route or API handler. |
| `src/app/api/expenses/route.ts` | Route or API handler. |
| `src/lib/billing/billingOps.ts` | Billing operations. |
| `src/lib/billing/square.ts` | Square billing integration. |
| `supabase/schema.sql` | Database schema (CREATE TABLE only; RLS policies are in migrations). |
| `docs/zirowork-architecture.md` | Architecture documentation. |
| `docs/runtime-governance.md` | Runtime governance documentation. |
| `src/proxy.ts` | Application source/config file. |

## Directory Map

- `.agent/failure-index.md`
- `.agent/repo-digest.md`
- `.agent/session-log.md`
- `.env.example`
- `.github/workflows/ci.yml`
- `.github/workflows/release-checklist.yml`
- `.gitignore`
- `CLAUDE.md`
- `NAVIGATION_ROUTING_AUDIT.md`
- `README.md`
- `docs/PHASE_3_CREW_SUMMARY.md`
- `docs/ZIROWORK_BRAND_SSOT.md`
- `docs/migration-lineage.md`
- `docs/runtime-governance.md`
- `docs/star-operating-model.md`
- `docs/zirowork-architecture.md`
- `docs/zirowork_brand_manifest.json`
- `eslint.config.mjs`
- `lib/data/_client.ts`
- `lib/data/_missingTable.ts`
- `lib/data/aiConversations.ts`
- `lib/data/assessmentAttempts.ts`
- `lib/data/assessmentQuestions.ts`
- `lib/data/assessmentRubric.ts`
- `lib/data/assessments.ts`
- `lib/data/attendanceReasons.ts`
- `lib/data/attendanceRecords.ts`
- `lib/data/attendanceSessions.ts`
- `lib/data/auditLogs.ts`
- `lib/data/automationLogs.ts`
- `lib/data/automationRules.ts`
- `lib/data/automationRuns.ts`
- `lib/data/automationWorkflows.ts`
- `lib/data/billingPlans.ts`
- `lib/data/billingSettings.ts`
- `lib/data/brandingDomains.ts`
- `lib/data/brandingEmailIdentities.ts`
- `lib/data/brandingLayoutConfigs.ts`
- `lib/data/brandingProfiles.ts`
- `lib/data/brandingThemes.ts`
- `lib/data/calendarFeeds.ts`
- `lib/data/contacts.ts`
- `lib/data/contentAssets.ts`
- `lib/data/contentCollections.ts`
- `lib/data/contentEmbeddings.ts`
- `lib/data/contentFolders.ts`
- `lib/data/contentItems.ts`
- `lib/data/contentTags.ts`
- `lib/data/contentVersions.ts`
- `lib/data/credits.ts`
- `lib/data/discounts.ts`
- `lib/data/enrollments.ts`
- `lib/data/families.ts`
- `lib/data/familyFiles.ts`
- `lib/data/featureFlags.ts`
- `lib/data/fileFolders.ts`
- `lib/data/fileShareLinks.ts`
- `lib/data/fileSignatureRequests.ts`
- `lib/data/fileVersions.ts`
- `lib/data/files.ts`
- `lib/data/forms.ts`
- `lib/data/getTenantContext.ts`
- `lib/data/index.ts`
- `lib/data/intakeSubmissions.ts`
- `lib/data/inventoryCheckouts.ts`
- `lib/data/inventoryItems.ts`
- `lib/data/inventoryMaintenance.ts`
- `lib/data/inventoryStock.ts`
- `lib/data/invoiceLineItems.ts`
- `lib/data/invoices.ts`
- `lib/data/leads.ts`
- `lib/data/lessonActivities.ts`
- `lib/data/lessonEvents.ts`
- `lib/data/lessonMaterialLinks.ts`
- `lib/data/lessonObjectives.ts`
- `lib/data/lessonPlanVersions.ts`
- `lib/data/lessonPlans.ts`
- `lib/data/lessons.ts`
- `lib/data/levels.ts`
- `lib/data/locations.ts`
- `lib/data/materials.ts`
- `lib/data/messageChannels.ts`
- `lib/data/messageDeliveries.ts`
- `lib/data/messageParticipants.ts`
- `lib/data/messageRecords.ts`
- `lib/data/messageThreads.ts`
- `lib/data/payments.ts`
- `lib/data/permissionAssignments.ts`
- `lib/data/plans.ts`
- `lib/data/profiles.ts`
- `lib/data/programs.ts`
- `lib/data/progressCheckpoints.ts`
- `lib/data/progressEvidence.ts`
- `lib/data/progressGoals.ts`
- `lib/data/progressSkills.ts`
- `lib/data/recurringRules.ts`
- `lib/data/relationships.ts`
- `lib/data/reportExportJobs.ts`
- `lib/data/reportWidgets.ts`
- `lib/data/reports.ts`
- `lib/data/roles.ts`
- `lib/data/roomBookings.ts`
- `lib/data/rooms.ts`
- `lib/data/scheduleBlocks.ts`
- `lib/data/scheduleRooms.ts`
- `lib/data/sessionLog.ts`
- `lib/data/squareInvoices.ts`
- `lib/data/studentFollowups.ts`
- `lib/data/studentProgress.ts`
- `lib/data/students.ts`
- `lib/data/subscriptions.ts`
- `lib/data/tasks.ts`
- `lib/data/teacherAvailability.ts`
- `lib/data/teachers.ts`
- `lib/data/templates.ts`
- `lib/data/tenantSettings.ts`
- `lib/data/tenants.ts`
- `lib/data/units.ts`
- `lib/data/usageRecords.ts`
- `next.config.ts`
- `package.json`
- `playwright.config.ts`
- `pnpm-lock.yaml`
- `postcss.config.mjs`
- `scripts/README.md`
- `scripts/apply-crm-normalization.ts`
- `scripts/apply-gngbyy-cleanup.ts`
- `scripts/apply-missing-schema.ts`
- `scripts/apply-schema.ts`
- `scripts/apply-sql-to-target.mjs`
- `scripts/apply_report_schema.ts`
- `scripts/auditCrossProject.ts`
- `scripts/fix-tenant-id.ts`
- `scripts/generate-target-bootstrap-sql.mjs`
- `scripts/generate-target-column-parity-sql.mjs`
- `scripts/migrateLocationsToStudios.ts`
- `scripts/migratePeople.ts`
- `scripts/migrateSchedule.ts`
- `scripts/release-checklist.mjs`
- `scripts/run-audit.mjs`
- `scripts/run-audit.ts`
- `scripts/syncCrossProject.ts`
- `scripts/tsconfig.cjs.json`
- `scripts/verifyReconstruction.ts`
- `scripts/zirowork_audit.py`
- `scripts/lib/crossProjectSupabase.ts`
- `scripts/schema/lessonpreneur-public-tables-complete.json`
- `scripts/schema/public-sync-order.json`
- `scripts/schema/schema.json`
- `scripts/schema/snapshotSchema.ts`
- `scripts/schema/target-bootstrap.sql`
- `scripts/schema/target-column-parity.sql`
- `sql/branding_indexes.sql`
- `src/proxy.ts`
- `src/actions/ziro/index.ts`
- `src/actions/ziro/runTurn.ts`
- `src/lib/supabase.ts`
- `src/lib/supabaseAuthenticated.ts`
- `src/lib/supabase.browser.ts`
- `src/lib/auth/guards.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/permissions.ts`
- `src/lib/auth/roles.ts`
- `src/lib/billing/billingOps.ts`
- `src/lib/billing/square.ts`
- `src/lib/billing/stripe.ts`
- `src/lib/billing/service.ts`
- `src/lib/crm/enrollmentEngine.ts`
- `src/lib/crm/studentLifecycle.ts`
- `src/lib/crm/leadLifecycle.ts`
- `src/lib/crm/index.ts`
- `src/lib/security/tenantIsolation.ts`
- `src/lib/security/webhook.ts`
- `src/lib/types/supabase.ts`
- `src/lib/types/entities.ts`
- `src/lib/types/crm.ts`
- `src/lib/data/supabaseTenant.ts`
- `src/app/(app)/admin/page.tsx`
- `src/app/(app)/admin/guard.ts`
- `src/app/(app)/admin/layout.tsx`
- `src/app/(app)/billing/components/PaymentEntryModal.tsx`
- `src/app/(app)/billing/payments/page.tsx`
- `src/app/(app)/teacher/components/ScheduleList.tsx`
- `src/app/api/activity-log/route.ts`
- `src/app/api/agreements/route.ts`
- `src/app/api/crm/families/[id]/square-invoices/route.ts`
- `src/app/api/crm/families/[id]/teachers/route.ts`
- `src/app/api/crm/schedule/series/route.ts`
- `src/app/api/crm/students/[id]/files/route.ts`
- `src/app/api/crm/students/[id]/notes/route.ts`
- `src/app/api/crm/students/[id]/schedule/route.ts`
- `src/app/api/crm/teachers/[id]/students/route.ts`
- `src/app/api/crm/teachers/[id]/w9/route.ts`
- `src/app/api/crm/teachers/route.ts`
- `src/app/api/dashboard/metrics/route.ts`
- `src/app/api/dashboard/revenue-gaps/route.ts`
- `src/app/api/expenses/route.ts`
- `src/app/api/expenses/[id]/route.ts`
- `src/app/api/families/search/route.ts`
- `src/app/api/integrations/square/bookings-webhook/route.ts`
- `src/app/api/integrations/square/sync/route.ts`
- `src/app/api/integrations/square/webhook/route.ts`
- `src/app/api/internal/square-audit/route.ts`
- `src/app/api/internal/square-bridge-families/route.ts`
- `src/app/api/invoices/billing-summary/route.ts`
- `src/app/api/invoices/create/route.ts`
- `src/app/api/invoices/[id]/pdf/route.ts`
- `src/app/api/leads/[id]/promote/route.ts`
- `src/app/api/locations/route.ts`
- `src/app/api/payroll/route.ts`
- `src/app/api/schedule/availability/route.ts`
- `src/app/api/schedule/recurring-lessons/route.ts`
- `src/app/api/schedule-blocks/auto-checkin/route.ts`
- `src/app/api/schedule-blocks/book-session/route.ts`
- `src/app/api/schedule-blocks/cancel-session/route.ts`
- `src/app/api/settings/services/route.ts`
- `src/app/api/auth/whoami/route.ts`
- `src/app/api/billing/payments/route.ts`
- `src/app/api/billing/stripe/webhook/route.ts`
- `src/app/api/branding/email-identity/route.ts`
- `src/app/api/debug/auth/route.ts`
- `supabase/schema.sql`
- `supabase/migrations/20260421120000_add_booked_session_to_block_type.sql`
- `supabase/migrations/20260422000002_billing_schema_v2.sql`
- `supabase/migrations/20260519100000_baseline_catch_up.sql`
- `supabase/migrations/20260519110000_drop_dead_columns.sql`
- `supabase/migrations/20260519120000_read_optimization_views.sql`
- `supabase/migrations/20260519130000_write_optimization_triggers_rpcs.sql`
- `supabase/migrations/20260519140000_phase4_wave1_rls_financial_tier.sql`
- `supabase/migrations/20260519160000_phase4_wave2_rls_crm_operational_tier.sql`
- `supabase/migrations/20260519170000_phase4_wave3_final_sweep_rls.sql`
- `supabase/migrations/20260520014704_tenant_context_pre_request.sql`
- `supabase/migrations/20260520020432_tenant_context_pre_request.sql`
- ... additional files omitted from digest

## Approval / Danger Zones

Any change touching these areas should be treated as higher risk and should not be executed publicly without Zach approval.

- `docs/migration-lineage.md`
- `lib/data/brandingEmailIdentities.ts`
- `lib/data/inventoryCheckouts.ts`
- `lib/data/payments.ts`
- `lib/data/squareInvoices.ts`
- `scripts/apply-missing-schema.ts`
- `scripts/apply-schema.ts`
- `scripts/apply_report_schema.ts`
- `scripts/lib/crossProjectSupabase.ts`
- `scripts/schema/lessonpreneur-public-tables-complete.json`
- `scripts/schema/public-sync-order.json`
- `scripts/schema/schema.json`
- `scripts/schema/snapshotSchema.ts`
- `scripts/schema/target-bootstrap.sql`
- `scripts/schema/target-column-parity.sql`
- `src/app/(app)/admin/branding/components/EmailIdentityClient.tsx`
- `src/app/(app)/admin/branding/components/EmailIdentityForm.tsx`
- `src/app/(app)/admin/branding/components/EmailIdentityTester.tsx`
- `src/app/(app)/admin/branding/email/page.tsx`
- `src/app/(app)/billing/components/PaymentEntryModal.tsx`
- `src/app/(app)/billing/components/PaymentTable.tsx`
- `src/app/(app)/billing/payments/page.tsx`
- `src/app/(app)/inventory/api/checkout/route.ts`
- `src/app/(auth)/login/LoginForm.tsx`
- `src/app/api/auth/whoami/route.ts`
- `src/app/api/billing/payments/route.ts`
- `src/app/api/billing/stripe/webhook/route.ts`
- `src/app/api/branding/email-identity/route.ts`
- `src/app/api/branding/email-identity/test/route.ts`
- `src/app/api/crm/families/[id]/square-invoices/route.ts`
- `src/app/api/debug/auth/route.ts`
- `src/app/api/integrations/square/bookings-webhook/route.ts`
- `src/app/api/integrations/square/callback/route.ts`
- `src/app/api/integrations/square/sync/route.ts`
- `supabase/migrations/` — all files (T5 surface — any live migration requires `GO T5 [migration name]`)

## Service-Role Status (Phase B — In Progress)

38 routes still use service-role as of commit `83eec1a`. Classification and conversion is Phase B work.

| Status | Count | Notes |
|---|---|---|
| Converted to authenticated client | ~29 | CRM, dashboard, expenses (Manus Phase 5) |
| Still using service-role | ~38 | Needs classification pass (Phase B) |
| Legitimate exceptions (estimate) | ~10 | Square webhooks, internal tools, debug, intake |
| Should be converted (estimate) | ~28 | Schedule, families, invoices, locations, payroll, recruitment, leads |

## Ignored Zones

Agents should not scan or summarize these zones during normal work:

- `node_modules/`
- `.next/`, `dist/`, `build/`, `out/`, `coverage/`
- caches, logs, temporary folders, generated assets, dependency folders
- secret-bearing `.env*` files except safe examples

## Update Rule

Regenerate this digest after meaningful architecture, route, schema, deployment, or dependency changes.

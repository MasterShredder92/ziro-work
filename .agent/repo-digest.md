# Repo Digest

> Generated read-only orientation file. Do not hand-edit unless the generator is unavailable.

## Metadata

| Field | Value |
|---|---|
| Repo | `ziro-work` |
| Project Type | Next.js / TypeScript web app |
| Generated | 2026-05-15 20:01:45 UTC |
| Git Branch | `main` |
| Git Commit | `d9fc85f` |

## Startup Rule

Read this digest before opening source files. Use it to choose exact paths for targeted reads. Do not broad-scan the repo unless this digest is missing, stale, or insufficient.

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
| `.env.example` | Relevant project file. |
| `CLAUDE.md` | Relevant project file. |
| `README.md` | Human-facing project overview. |
| `next.config.ts` | Application source/config file. |
| `package-lock.json` | Relevant project file. |
| `package.json` | Node project metadata, dependencies, and scripts. |
| `pnpm-lock.yaml` | Relevant project file. |
| `tsconfig.json` | Relevant project file. |
| `vercel.json` | Deployment/platform configuration. |
| `scripts/README.md` | Human-facing project overview. |
| `scripts/apply-crm-normalization.ts` | Application source/config file. |
| `scripts/apply-gngbyy-cleanup.ts` | Application source/config file. |
| `scripts/apply-missing-schema.ts` | Database schema, migration, or ORM configuration. |
| `scripts/apply-schema.ts` | Database schema, migration, or ORM configuration. |
| `scripts/apply_report_schema.ts` | Database schema, migration, or ORM configuration. |
| `scripts/auditCrossProject.ts` | Application source/config file. |
| `scripts/check_all_schedule.ts` | Application source/config file. |
| `scripts/check_models.py` | Python source file. |
| `scripts/create_test_student.js` | Application source/config file. |
| `scripts/debug_schedule_data.ts` | Application source/config file. |
| `scripts/diag-families.ts` | Application source/config file. |
| `scripts/find_any_nathan_student.ts` | Application source/config file. |
| `scripts/fix-tenant-id.ts` | Application source/config file. |
| `scripts/generate_report_pdf.py` | Python source file. |
| `scripts/get_nathan_schedule.ts` | Application source/config file. |
| `scripts/get_nathan_schedule_2027.ts` | Application source/config file. |
| `scripts/get_nathan_today_final.ts` | Application source/config file. |
| `scripts/get_nathan_weekly.ts` | Application source/config file. |
| `scripts/lessonpreneur-worker.js` | Application source/config file. |
| `scripts/link_nina_report.ts` | Application source/config file. |
| `scripts/list_all_teachers.ts` | Application source/config file. |
| `scripts/manual_report_nina.ts` | Application source/config file. |
| `scripts/manual_report_nina_v2.ts` | Application source/config file. |
| `scripts/migrateLocationsToStudios.ts` | Application source/config file. |
| `scripts/migratePeople.ts` | Application source/config file. |
| `scripts/migrateSchedule.ts` | Application source/config file. |
| `scripts/run-audit.ts` | Application source/config file. |
| `scripts/syncCrossProject.ts` | Application source/config file. |
| `scripts/test_generate_report.js` | Application source/config file. |
| `scripts/test_generate_report.ts` | Application source/config file. |
| `scripts/tsconfig.cjs.json` | Relevant project file. |
| `scripts/verifyReconstruction.ts` | Application source/config file. |
| `scripts/zirowork_audit.py` | Python source file. |
| `src/proxy.ts` | Application source/config file. |
| `supabase/schema.sql` | Database schema, migration, or ORM configuration. |
| `supabase/seed_orchestrator_v2.sql` | Relevant project file. |
| `supabase/seed_orchestrator_v3.sql` | Relevant project file. |
| `.github/workflows/ci.yml` | Agent/workflow orchestration logic. |
| `.github/workflows/release-checklist.yml` | Agent/workflow orchestration logic. |
| `lib/data/_client.ts` | Application source/config file. |
| `lib/data/_missingTable.ts` | Application source/config file. |
| `lib/data/aiConversations.ts` | Application source/config file. |
| `lib/data/assessmentAttempts.ts` | Application source/config file. |
| `lib/data/assessmentQuestions.ts` | Application source/config file. |
| `lib/data/assessmentRubric.ts` | Application source/config file. |
| `lib/data/assessments.ts` | Application source/config file. |
| `lib/data/attendanceReasons.ts` | Application source/config file. |
| `lib/data/attendanceRecords.ts` | Application source/config file. |
| `lib/data/attendanceSessions.ts` | Application source/config file. |
| `lib/data/auditLogs.ts` | Application source/config file. |
| `lib/data/automationLogs.ts` | Application source/config file. |
| `lib/data/automationRules.ts` | Application source/config file. |
| `lib/data/automationRuns.ts` | Application source/config file. |
| `lib/data/automationWorkflows.ts` | Agent/workflow orchestration logic. |
| `lib/data/billingPlans.ts` | Application source/config file. |
| `lib/data/billingSettings.ts` | Application source/config file. |
| `lib/data/brandingDomains.ts` | Application source/config file. |
| `lib/data/brandingEmailIdentities.ts` | Email or notification logic. |
| `lib/data/brandingLayoutConfigs.ts` | Application source/config file. |
| `lib/data/brandingProfiles.ts` | Application source/config file. |
| `lib/data/brandingThemes.ts` | Application source/config file. |
| `lib/data/calendarFeeds.ts` | Application source/config file. |
| `lib/data/contacts.ts` | Application source/config file. |
| `lib/data/contentAssets.ts` | Application source/config file. |
| `lib/data/contentCollections.ts` | Application source/config file. |
| `lib/data/contentEmbeddings.ts` | Application source/config file. |
| `lib/data/contentFolders.ts` | Application source/config file. |
| `lib/data/contentItems.ts` | Application source/config file. |
| `lib/data/contentTags.ts` | Application source/config file. |
| `lib/data/contentVersions.ts` | Application source/config file. |

## Directory Map

- `.env.example`
- `.gitignore`
- `CLAUDE.md`
- `NAVIGATION_ROUTING_AUDIT.md`
- `README.md`
- `eslint.config.mjs`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `pnpm-lock.yaml`
- `postcss.config.mjs`
- `tsconfig.json`
- `vercel.json`
- `vitest.config.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release-checklist.yml`
- `docs/PHASE_3_CREW_SUMMARY.md`
- `docs/ZIROWORK_BRAND_SSOT.md`
- `docs/migration-lineage.md`
- `docs/runtime-governance.md`
- `docs/star-operating-model.md`
- `docs/zirowork-architecture.md`
- `docs/zirowork_brand_manifest.json`
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
- `scripts/README.md`
- `scripts/apply-crm-normalization.ts`
- `scripts/apply-gngbyy-cleanup.ts`
- `scripts/apply-missing-schema.ts`
- `scripts/apply-schema.ts`
- `scripts/apply-sql-to-target.mjs`
- `scripts/apply_report_schema.ts`
- `scripts/auditCrossProject.ts`
- `scripts/check_all_schedule.ts`
- `scripts/check_models.py`
- `scripts/create_test_student.js`
- `scripts/debug_schedule_data.ts`
- `scripts/diag-families.ts`
- `scripts/find_any_nathan_student.ts`
- `scripts/fix-tenant-id.ts`
- `scripts/generate-target-bootstrap-sql.mjs`
- `scripts/generate-target-column-parity-sql.mjs`
- `scripts/generate_report_pdf.py`
- `scripts/get_nathan_schedule.ts`
- `scripts/get_nathan_schedule_2027.ts`
- `scripts/get_nathan_today_final.ts`
- `scripts/get_nathan_weekly.ts`
- `scripts/lessonpreneur-worker.js`
- `scripts/link_nina_report.ts`
- `scripts/list_all_teachers.ts`
- `scripts/manual_report_nina.ts`
- `scripts/manual_report_nina_v2.ts`
- `scripts/migrateLocationsToStudios.ts`
- `scripts/migratePeople.ts`
- `scripts/migrateSchedule.ts`
- `scripts/release-checklist.mjs`
- `scripts/run-audit.mjs`
- `scripts/run-audit.ts`
- `scripts/seed-agent-pngs.mjs`
- `scripts/smoke-routes.mjs`
- `scripts/syncCrossProject.ts`
- `scripts/test_generate_report.js`
- `scripts/test_generate_report.ts`
- `scripts/tsconfig.cjs.json`
- `scripts/verifyReconstruction.ts`
- `scripts/ziro-auto-run.mjs`
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
- `src/app/global-error.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/not-found.tsx`
- `src/app/opengraph-image.tsx`
- `src/app/sitemap.ts`
- `src/app/(app)/error.tsx`
- `src/app/(app)/forbidden.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/loading.tsx`
- `src/app/(app)/not-found.tsx`
- `src/app/(app)/unauthorized.tsx`
- `src/app/(app)/admin/_nav.tsx`
- `src/app/(app)/admin/error.tsx`
- `src/app/(app)/admin/guard.ts`
- `src/app/(app)/admin/layout.tsx`
- `src/app/(app)/admin/page.tsx`
- `src/app/(app)/admin/api/dashboard/route.ts`
- `src/app/(app)/admin/api/system/dead-letter/[id]/requeue/route.ts`
- `src/app/(app)/admin/audit/page.tsx`
- `src/app/(app)/admin/branding/BrandingForbidden.tsx`
- `src/app/(app)/admin/branding/guard.ts`
- `src/app/(app)/admin/branding/layout.tsx`
- `src/app/(app)/admin/branding/page.tsx`
- `src/app/(app)/admin/branding/tenant.ts`
- `src/app/(app)/admin/branding/components/BrandingDashboard.tsx`
- `src/app/(app)/admin/branding/components/BrandingPreview.tsx`
- `src/app/(app)/admin/branding/components/BrandingShell.tsx`
- `src/app/(app)/admin/branding/components/BrandingSidebar.tsx`
- `src/app/(app)/admin/branding/components/BrandingStyleTag.tsx`
- `src/app/(app)/admin/branding/components/ColorPicker.tsx`
- `src/app/(app)/admin/branding/components/DomainManager.tsx`
- `src/app/(app)/admin/branding/components/DomainManagerClient.tsx`
- `src/app/(app)/admin/branding/components/DomainStatusBadge.tsx`
- `src/app/(app)/admin/branding/components/EmailIdentityClient.tsx`
- `src/app/(app)/admin/branding/components/EmailIdentityForm.tsx`
- `src/app/(app)/admin/branding/components/EmailIdentityTester.tsx`
- `src/app/(app)/admin/branding/components/FaviconUploader.tsx`
- `src/app/(app)/admin/branding/components/LogoUploader.tsx`
- `src/app/(app)/admin/branding/components/PortalLayoutForm.tsx`
- `src/app/(app)/admin/branding/components/PortalLayoutPreview.tsx`
- `src/app/(app)/admin/branding/components/ThemeEditor.tsx`
- `src/app/(app)/admin/branding/components/ThemeEditorClient.tsx`
- `src/app/(app)/admin/branding/components/ThemePreviewCard.tsx`
- `src/app/(app)/admin/branding/components/index.ts`
- `src/app/(app)/admin/branding/domain/page.tsx`
- `src/app/(app)/admin/branding/domains/page.tsx`
- `src/app/(app)/admin/branding/email/page.tsx`
- `src/app/(app)/admin/branding/layouts/page.tsx`
- `src/app/(app)/admin/branding/preview/page.tsx`
- `src/app/(app)/admin/branding/theme/page.tsx`
- `src/app/(app)/admin/components/AuditLogTable.tsx`
- `src/app/(app)/admin/components/ColorPicker.tsx`
- `src/app/(app)/admin/components/DataTable.tsx`
- `src/app/(app)/admin/components/FeatureFlagToggle.tsx`
- `src/app/(app)/admin/components/InvoiceAgingChart.tsx`
- `src/app/(app)/admin/components/KpiCard.tsx`
- `src/app/(app)/admin/components/LogoUploader.tsx`
- `src/app/(app)/admin/components/PermissionMatrix.tsx`
- `src/app/(app)/admin/components/RoleEditor.tsx`
- `src/app/(app)/admin/components/RoleSwitcher.tsx`
- `src/app/(app)/admin/components/ScheduleHeatmap.tsx`
- `... additional files omitted from digest`

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
- `src/app/(app)/email-preview/_client.tsx`
- `src/app/(app)/email-preview/page.tsx`
- `src/app/(app)/email-templates/_client.tsx`
- `src/app/(app)/email-templates/page.tsx`
- `src/app/(app)/inventory/api/checkout/route.ts`
- `src/app/(app)/inventory/components/CheckoutForm.tsx`
- `src/app/(app)/inventory/components/CheckoutList.tsx`
- `src/app/(app)/unauthorized.tsx`
- `src/app/(auth)/forgot-password/ForgotPasswordForm.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/LoginForm.tsx`
- `src/app/(auth)/login/LoginPageClient.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/reset-password/ResetPasswordForm.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(sandbox)/sandbox/email/page.tsx`
- `src/app/api/auth/whoami/route.ts`
- `src/app/api/billing/payments/route.ts`
- `src/app/api/billing/stripe/webhook/route.ts`
- `src/app/api/branding/_auth.ts`
- `src/app/api/branding/email-identity/route.ts`
- `src/app/api/branding/email-identity/test/route.ts`
- `src/app/api/crm/families/[id]/square-invoices/route.ts`
- `src/app/api/debug/auth/route.ts`
- `src/app/api/integrations/square/bookings-webhook/route.ts`
- `src/app/api/integrations/square/callback/route.ts`
- `src/app/api/integrations/square/sync/route.ts`

## Ignored Zones

Agents should not scan or summarize these zones during normal work:

- `node_modules/`
- `.next/`, `dist/`, `build/`, `out/`, `coverage/`
- caches, logs, temporary folders, generated assets, dependency folders
- secret-bearing `.env*` files except safe examples

## Update Rule

Regenerate this digest after meaningful architecture, route, schema, deployment, or dependency changes.

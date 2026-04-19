# Runtime Governance Sync

This document aligns architecture intent with the current runtime behavior.

## Core Runtime Contracts

- **Migrations:** canonical lineage is defined in `docs/migration-lineage.md` and anchored by `20260417010000_lessonpreneur_core_schema.sql`.
- **Automation runtime:** workflow executions are persisted in `automation_runs`; queue handoff uses `automation.run` jobs and a registered handler in `src/lib/queue/registerHandlers.ts`.
- **Billing automation bridge:** Stripe webhook handlers update domain records and emit automation triggers for:
  - `billing.invoice.paid`
  - `billing.invoice.failed`
  - `billing.subscription.updated`
- **Messaging attachments:** composer uploads binary files, message routes persist file records, and delivery metadata carries attachment payload descriptors.

## Governance Policies

- Prefer idempotent SQL migrations and avoid destructive drop/rebuild migrations in shared production lineage.
- Keep new API surfaces thin and delegate to domain services (`src/lib/**`) or data facades (`lib/data/**`).
- Automation actions must perform real mutations for CRM, Billing, Scheduling, or Messaging; stubs are disallowed in production paths.

## Release Checklist Automation

- `scripts/release-checklist.mjs` runs lint + smoke API checks.
- CI runs smoke tests via `.github/workflows/ci.yml`.
- Manual release preflight is available through `.github/workflows/release-checklist.yml`.

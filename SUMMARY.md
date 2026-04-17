# Final Cleanup + Production Hardening Bundle

This bundle lands foundational hardening across error handling, rate limiting,
performance, security, observability, durable jobs, and global search. It is
deliberately internal — no public marketing UI was touched, and no existing
subsystem logic was rewritten.

## What changed

### Task Group 1 — Global error handling
- `src/lib/errors/AppError.ts` — standardized error class with `{ code, message, details, requestId }` wire shape and static constructors (`badRequest`, `forbidden`, `notFound`, `rateLimited`, `internal`, etc.).
- `src/lib/errors/serialize.ts` — normalizes any thrown value into the stable shape without leaking stack traces.
- `src/lib/errors/handler.ts` — `withApi({ name }, handler)` HOF that assigns a request id, times the request, catches every exception, logs unhandled ones, emits counters, and returns the standardized JSON body.
- `src/lib/observability/requestId.ts` / `logger.ts` — structured JSON logger + request-id utility.
- `src/app/(app)/error.tsx` / `not-found.tsx` / `forbidden/page.tsx` — shared fallbacks for the authenticated app shell. 404 / 403 / 500 surfaces only, no marketing.
- Per-portal error boundaries at `src/app/(app)/{admin,director,teacher,family,student}/error.tsx`, all delegating to `components/system/PortalErrorBoundary.tsx`.

### Task Group 2 — Rate limiting + abuse protection
- `src/lib/ratelimit/limiter.ts` — in-memory sliding window limiter keyed by tenant / ip / tenant+ip composite.
- `src/lib/ratelimit/policies.ts` — canonical policies for public forms, public signature pages, public share links, login attempts, and a global IP-burst ceiling. All tunable via `ZIRO_RL_*` env vars.
- `src/lib/ratelimit/audit.ts` — best-effort inserts into `rate_limit_hits` plus a metric counter and structured warning. Safe if the table doesn't exist yet.
- `src/lib/ratelimit/index.ts` — `enforceLimit` / `enforceOrThrow` / `enforceIpBurst` helpers for API routes.
- `src/middleware.ts` — IP-burst ceiling now enforced on all protected portal paths at the edge. Returns 429 with `retry-after` when tripped.

### Task Group 3 — Performance
- `src/lib/cache/memoCache.ts` — TTL map with single-flight de-duplication.
- `src/lib/cache/keys.ts` — canonical key builder (`<namespace>:<tenant>:<kind>:<params>`) so whole families are invalidatable.
- `src/lib/cache/index.ts` — pre-built subsystem caches: `crmCache`, `templateCache`, `progressCache`, `assessmentCache`, `scheduleCache`, plus an `invalidateTenant(tenantId)` helper for destructive admin ops.
- `src/lib/selectors/memoize.ts` — `createMemoSelector` + `createDeepMemoSelector` for heavy UI computations.
- `src/components/system/LazyBoundary.tsx` — shared Suspense wrapper for code-split heavy pages (reports / content library / files).
- `src/lib/images/optimize.ts` — `optimizedImageUrl` / `buildSrcSet` for Supabase-stored assets using the storage image-transformation endpoint.

### Task Group 4 — Security hardening
- `src/lib/security/crypto.ts` — AES-256-GCM with `ZIRO_ENCRYPTION_KEY`. Stores `{v, iv, tag, ct, aad?}` envelopes. SHA-256 key derivation for non-hex passphrases with a one-time warning; refuses to run without a key. Constant-time string compare.
- `src/lib/security/webhook.ts` — HMAC-SHA256 signature verification (`X-Ziro-Signature: t=..,v1=..`) with 5-minute skew tolerance. `requireValidWebhook` throws `AppError.forbidden` on failure.
- `src/lib/security/csrf.ts` — double-submit token (`ziro_csrf` cookie + `x-ziro-csrf` header / `_csrf` form field). `ensureCsrfToken()` for the render path, `requireCsrf(req)` for mutating endpoints. `isCsrfExempt` for bearer-token / webhook-signed requests.
- `src/lib/security/headers.ts` — CSP, HSTS (prod only), X-Frame-Options=DENY, X-Content-Type-Options=nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP.
- `src/lib/security/tenantIsolation.ts` — `assertTenantScoped` / `filterByTenant` throwing the new AppError shape.
- `src/middleware.ts` now emits security headers on `/admin`, `/director`, `/teacher`, `/family`, `/student`, `/dashboard`, and `/api/*` — marketing paths are excluded.

### Task Group 5 — Audit + observability
- `src/lib/observability/metrics.ts` — Prometheus-shaped no-op facade: `incrementCounter`, `setGauge`, `observeHistogram`, `timeAsync`, plus a `snapshot()` / `renderPrometheus()` text exporter. Global bag so counters survive hot reload in dev.
- `src/lib/observability/health.ts` — registry-based health checks with 5s per-check timeout. Built-ins: `database`, `storage`, `automation_queue`, `messaging_queue`.
- `src/app/api/health/route.ts` — public health report. `200` for ok/degraded, `503` for down.
- `src/app/api/metrics/route.ts` — Prometheus text exposition; gated by `ZIRO_METRICS_TOKEN` (endpoint returns 404 if unset).
- Structured logs emitted from `withApi`, rate-limit audit, queue runner, and error boundaries.

### Task Group 6 — Background jobs + queue stability
- Migration `supabase/migrations/20260417_hardening_queue_and_audit.sql` — new tables: `jobs`, `job_runs`, `dead_letter_jobs`, `rate_limit_hits`, `security_events`.
- `src/lib/queue/types.ts` + `queries.ts` — typed facade: `enqueueJob`, `claimNextJob`, `completeJob`, `failJob`, `recordJobRun`, `moveToDeadLetter`, `listJobs`, `listDeadLetter`, `requeueFromDeadLetter`, `getJobRuns`. All resilient to the tables not existing yet.
- `src/lib/queue/retry.ts` — exponential backoff with jitter (`withRetry`, `computeBackoffMs`).
- `src/lib/queue/runner.ts` — `registerJobHandler(kind, handler)` + `tick({ maxJobs, kinds })`. Emits metrics/logs, records per-attempt runs, routes terminal failures to DLQ.
- `src/app/api/queue/tick/route.ts` — internal cron endpoint. Accepts Vercel Cron or `Authorization: Bearer <ZIRO_QUEUE_TOKEN>`.
- `src/app/(app)/admin/system/page.tsx` + `SystemView.tsx` — admin visibility into active / recent / dead-letter jobs and live health checks. Requeue button calls `POST /admin/api/system/dead-letter/[id]/requeue`.

### Task Group 7 — Global search
- `src/lib/search/service.ts` — tenant-scoped search across `contacts`, `students`, `leads`, `forms`, `templates`, `content_items`. `ilike` prefilter + in-memory fuzzy scoring using existing `src/lib/search/fuzzy.ts`. Admin bypass for cross-tenant search.
- `src/app/api/search/route.ts` — authenticated endpoint, 2-char minimum, 128-char maximum, rate-limited.
- No public search UI added this pass (see Deferred).

## What's stubbed / intentionally limited

- **Metrics collector** is per-instance in-memory. Counters reset across serverless invocations. `/api/metrics` is Prometheus-format-compatible but only reflects the state of whichever instance served the scrape. Swap-in points documented inside `metrics.ts`.
- **Rate limiter** is likewise per-instance. The durable audit trail in `rate_limit_hits` is the source of truth for abuse analysis; the token bucket is soft. For distributed accuracy, drop in Upstash/Redis behind `checkLimit` without touching call sites.
- **CSRF** is available and enforced on opt-in routes that call `requireCsrf`. It is NOT yet wired into every POST — doing that universally risks breaking existing flows with legacy client code. The helper is ready; the audit of call sites is a separate pass.
- **Encryption** is a utility only. No existing column was migrated to ciphertext in this pass. Call sites for PII / tokens should adopt `encrypt` / `decrypt` when they land schema changes.
- **Queue handlers** are not yet registered for `messaging.delivery`, `automation.action`, or `export.report`. The runner is ready; each subsystem registers its own handler with `registerJobHandler(kind, fn)` and then calls `enqueueJob(...)` instead of running inline. This keeps the migration incremental.
- **Performance caches** expose opt-in helpers. Existing data facades were intentionally not rewritten — each call site decides when to wrap reads in `crmCache.cached(...)`, etc.
- **Lazy-loading** ships the `LazyBoundary` component only. Converting heavy pages (reports, content library, files) to `dynamic()` imports is a targeted follow-up per page.

## What's deferred / awaiting spec

- **Task Groups 8–11 — not received.** The original request ended mid-sentence at "TASK GROUP 7 — GLOBAL SEARCH". Please send the remaining groups and I'll execute them as a follow-up bundle.
- **Public marketing error pages.** Per the website freeze in `AGENTS.md`, the marketing site still uses the repo's root `src/app/not-found.tsx`. Error boundaries for marketing are out of scope until the freeze lifts.
- **Login throttling at the edge.** This codebase uses Supabase client-side auth (`supabase.auth.signInWithPassword` in the browser), so login attempts don't pass through the Next.js server. The `loginIp` / `loginTenantIp` policies are defined and ready to be called from any future server-side login proxy endpoint.

## Known issues & pre-existing cleanup

- **~30 pre-existing TypeScript errors in the forms subsystem** (`tsc.log`): missing exports from `@/lib/forms/queries`, shape mismatches on `FormWithFields` vs `Form`, and object-literal keys that aren't in `FormInput`. Not touched in this bundle per instructions; call them out here so the next owner doesn't mistake them for regressions.
- **`src/components/system/` already exists** with an unrelated `SystemProviders` component. I added `PortalErrorBoundary.tsx` and `LazyBoundary.tsx` alongside it without touching the existing files.
- **Migration not applied.** `20260417_hardening_queue_and_audit.sql` is checked in but not run. Run it with `supabase db push` (or your usual migration runner) before enabling queue handlers; the rate-limit and queue code tolerates the missing tables gracefully until then.

## Environment variables

| Name                              | Purpose                                                           | Required?               |
| --------------------------------- | ----------------------------------------------------------------- | ----------------------- |
| `ZIRO_ENCRYPTION_KEY`             | AES-256-GCM key (64 hex chars preferred; any string otherwise).   | Yes, for crypto paths.  |
| `ZIRO_METRICS_TOKEN`              | Bearer token for `/api/metrics`. Unset = endpoint disabled (404). | Optional.               |
| `ZIRO_QUEUE_TOKEN`                | Bearer token for `/api/queue/tick` when not running via Vercel Cron. | Required for cron path. |
| `ZIRO_LOG_LEVEL`                  | `debug` \| `info` \| `warn` \| `error`. Default `info`.           | Optional.               |
| `ZIRO_RL_*`                       | Per-policy overrides — see `src/lib/ratelimit/policies.ts`.       | Optional.               |

## File map

```
src/lib/errors/           AppError, serialize, withApi HOF
src/lib/observability/    logger, metrics, requestId, health
src/lib/ratelimit/        limiter, policies, audit
src/lib/cache/            memoCache, keys, subsystem caches
src/lib/selectors/        memoize
src/lib/security/         crypto, webhook, csrf, headers, tenantIsolation
src/lib/queue/            queries, runner, retry, types
src/lib/search/           service (fuzzy/ already existed)
src/lib/images/           optimize
src/components/system/    PortalErrorBoundary, LazyBoundary (additive)
src/app/(app)/            error.tsx, not-found.tsx, forbidden/page.tsx,
                          {admin,director,teacher,family,student}/error.tsx,
                          admin/system/{page.tsx, SystemView.tsx},
                          admin/api/system/dead-letter/[id]/requeue/route.ts
src/app/api/              health/, metrics/, queue/tick/, search/
src/middleware.ts         IP-burst + security headers (app/api paths only)
supabase/migrations/      20260417_hardening_queue_and_audit.sql
```

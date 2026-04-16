📘 ZiroWork Architecture Summary (Master Document)
This file describes the full architecture, runtime, agents, tools, workflows, and system design of the ZiroWork platform as of April 2026.

#️⃣ 1. System Overview
ZiroWork is a multi‑tenant, agent‑driven operational automation platform designed to run small‑business operations (starting with music schools).
It is built around:

A runtime loop

A task queue

An event bus

A tool registry

An agent registry

A tenant‑aware Supabase integration

A clean separation of concerns

The system is designed to be:

modular

predictable

scalable

maintainable

event‑driven

agent‑driven

tool‑driven

This architecture replaces brittle prototype logic with a real operating system for business automation.

#️⃣ 2. Core Runtime Architecture
2.1 Runtime Loop
`src/lib/agents/runtime.ts` runs a timer-driven loop that dequeues one task at a time, resolves the target agent by `task.name` (the agent `id` passed to `enqueue_task` as `agent`), invokes that agent’s `onTask(task, ctx)`, and notifies subscribers via `emit()` from `src/lib/agents/eventBus.ts` (`task_processed`, `task_completed`). It does not automatically call `dashboardAgent.run()` unless something enqueues work that triggers it (e.g. `dashboard_tick`).

2.2 Agent Registry
Agents register via `registerAgent(agent)` in `src/lib/agents/registry.ts`. Each `AgentDefinition` includes at least `id`, `name`, `description`, `run(ctx)`, and optional `onTask(task, ctx)` / `onEvent(event, ctx)`.

Agents currently implemented:

`dashboard` (`dashboardAgent` in `src/lib/agents/dashboardAgent.ts`)

`enrollmentCoordinator` (`enrollmentCoordinator` in `src/lib/agents/enrollmentCoordinator.ts`)

2.3 Tool Registry
Tools register via `registerTool({ name, run })` in `src/lib/agents/tools.ts`. Each `run(args, ctx)` receives tool arguments first, then the full `AgentContext` (including `supabase`).

Invocation (browser bootstrap in `src/app/layout.tsx`):

Code
ctx.tools.<toolName>(args)  // implemented as runTool("<toolName>", args, ctx)
Tool modules live under `src/lib/agents/tools/`; pure helpers (e.g. aging/planning) often live under `src/lib/tools/` and are imported by the thin registrars.

2.4 Task Queue
Agents enqueue work with:

Code
ctx.tools.enqueue_task({ agent, payload })
The queue stores `{ name: agent, payload, createdAt }`. The worker passes `name` through to `getAgentById` for dispatch.

2.5 Events: in-memory bus vs Supabase log
In-memory coordination uses `subscribe` / `emit` in `src/lib/agents/eventBus.ts` (e.g. dashboard subscribing to `task_processed`).

Durable, queryable activity uses:

Code
ctx.tools.log_event({ type, payload, tenantId })
implemented by the `log_event` tool (Supabase insert). Standardized `type` values are listed under §4.3 (`log_event` bullet).

#️⃣ 3. Agent Context
Every agent receives a `ctx` object containing:

`tenantId`

`supabase` (tenant‑aware client from `getSupabase(tenantId)`)

`tools` (all registered tools — in the browser, wired explicitly in `src/app/layout.tsx` alongside `init` imports from `src/lib/agents/init.ts`)

Optional: `userId`, `role`, `page`, `data`

This keeps tools and agents multi‑tenant aware. **Note:** the dev client seeds a `dashboard_tick` task so `dashboardAgent.run(ctx)` runs on an interval; production should use server-side scheduling (cron / Edge Function) per tenant.

#️⃣ 4. Supabase Integration
4.1 Supabase Wrapper
Located at:

Code
src/lib/agents/supabase.ts
Provides:

Code
getSupabase(tenantId)
This attaches:

Code
"x-tenant-id": tenantId
to all requests.

4.2 Supabase Reads Implemented
get_leads (rows include `status`, `last_contacted_at`, `inactivity_bucket` for lifecycle and aging)

get_trials (rows include `status`, `last_reminded_at`, `inactivity_bucket`, `attended`, `enrollment_decision`, `scheduled_at` / legacy `time`, optional `lead_id`)

get_students (rows include `enrollment_date`, `onboarding_stage`, `last_attendance_at`, `attendance_streak`, `churn_risk`, optional `lead_id`; optional `filter: { id }`)

get_kpis

get_tenant_settings (reads merged `tenant_settings` row for `ctx.tenantId`, with safe JSON defaults for pipelines, thresholds, schedule, and event filters)

4.3 Supabase Writes Implemented
update_lead_status (updates `status`, optional `last_contacted_at`, `inactivity_bucket`)

log_lead_follow_up

schedule_trial

update_trial_status

create_enrollment (inserts `students` for a `lead_id`; idempotent when a student already exists for that lead)

update_student

log_event (low‑level insert into `events`; still available for tooling)

log_tenant_event (tenant‑aware wrapper: loads `tenant_settings.events.disabled` and skips suppressed `type` values before inserting via the same `events` table)

Standardized `type` values include `lead_inactivity_detected`, `lead_followed_up`, `lead_marked_lost`, `trial_inactivity_detected`, `trial_confirmed`, `trial_follow_up`, `trial_final_nudge`, `trial_marked_lost`, `trial_ready_for_enrollment`, `student_enrolled`, `onboarding_welcome_sent`, `onboarding_checkin_sent`, `retention_nudge_sent`, `student_at_risk_detected`, `attendance_checkin_sent`, `kpi_snapshot`, etc.; later bundles may add `lead_converted_to_trial`, `lead_converted_to_enrollment`)

4.4 Schema migrations (pipelines)
Representative SQL migrations under `supabase/migrations/`:

`20260416120000_leads_lifecycle_columns.sql` — lead `status`, `last_contacted_at`, `inactivity_bucket` (+ optional `lead_followups.reason`)

`20260416140000_trials_lifecycle_bundle11.sql` — trials table baseline + `status`, `last_reminded_at`, `inactivity_bucket`, `attended`, `enrollment_decision`, `scheduled_at`, `lead_id`

`20260416150000_students_enrollment_bundle12.sql` — students baseline + onboarding / attendance / `lead_id` columns

`20260416160000_attendance_retention_bundle13.sql` — `attendance` table (`tenant_id` text per app convention, `student_id` FK, `lesson_date`, `present`) + reinforces student churn / attendance columns

`20260416170000_tenant_settings_bundle14.sql` — `tenant_settings` (`tenant_id` text PK, JSONB columns for each pipeline, KPI weights, `schedule`, `pipelines` toggles, `events.disabled` list)

4.5 Shared TypeScript types
`src/lib/types/leads.ts` — `Lead`, `LeadStatus`, `InactivityBucket`

`src/lib/types/trials.ts` — `Trial`, `TrialStatus`, `TrialInactivityBucket`

`src/lib/types/students.ts` — `Student`, `OnboardingStage`

`src/lib/types/attendance.ts` — `Attendance`

`src/lib/types/tenantSettings.ts` — merged settings shape (`MergedTenantSettings`)

4.6 Tenant settings (Bundle 14)
`public.tenant_settings` stores per‑tenant JSON for **lead** / **trial** / **retention** thresholds (e.g. `dead_after_days`, `stale_after_days`, `warning_threshold`, `risk_threshold`), **KPI weights**, **`schedule.dashboard_tick_ms`**, **`pipelines`** booleans (`lead`, `trial`, `enrollment`, `retention`), and **`events.disabled`** (event `type` strings to suppress).

`getTenantSettings` merges DB rows with code defaults so the runtime never depends on a seed row.

Aging helpers (`compute_lead_aging`, `compute_trial_aging`, `compute_attendance_health` via `detect_at_risk_students`) read thresholds from these settings.

#️⃣ 5. Agents
5.1 Dashboard Agent
Located at:

Code
src/lib/agents/dashboardAgent.ts
Responsibilities:
Fetch KPIs

Score leads

Detect high‑quality leads

Detect stale leads

Detect low trial volume

Emit KPI snapshot events

Delegate tasks to enrollmentCoordinator

Behaviors:
Loads `get_tenant_settings` and respects `pipelines.*` toggles (default all `true`): when `lead` is off, lead scoring / stale / inactive‑lead / `check_leads` / enrollment‑issue heuristics are skipped; when `trial` is off, low‑trial‑volume and inactive‑trial detection are skipped; when `enrollment` is off, trial→enrollment detection is skipped; when `retention` is off, at‑risk student detection is skipped.

`compute_tenant_kpis` replaces the raw snapshot source for the dashboard pass: extends `get_kpis` with a tenant‑weighted `score` (`kpi_settings` weights).

If `pipelines.lead` and `kpis.leadsThisWeek > 5` → enqueue `high_lead_volume`

If `pipelines.trial` and `kpis.trialsScheduled < 2` → enqueue `low_trial_volume`

If `pipelines.lead`: score leads, enqueue `high_quality_leads` / `stale_leads`, run `detect_inactive_leads` + `lead_inactivity_detected` via `log_tenant_event`

If `pipelines.trial`: `detect_inactive_trials` + `trial_inactivity_detected`

If `pipelines.enrollment`: `detect_trial_to_enrollment` + `trial_ready_for_enrollment`

If `pipelines.retention`: `detect_at_risk_students` + `student_at_risk_detected`

Self‑driving tick: `dashboard_tick` calls `run()`, then re‑enqueues using `schedule.dashboard_tick_ms` from tenant settings (min 5s), falling back to the payload `intervalMs`, then 60s. `layout.tsx` seeds an initial tick.

KPI snapshot and pipeline events use `log_tenant_event` (respects per‑tenant disabled list)

5.2 Enrollment Coordinator
Located at:

Code
src/lib/agents/enrollmentCoordinator.ts
Responsibilities:
Handle follow‑ups

Handle trial scheduling

Handle trial reminders

Handle high‑quality leads

Handle stale leads

Perform real Supabase writes

Lifecycle logging uses `log_tenant_event` (shared `tenantLog` helper) so noisy event types can be filtered per tenant.

Behaviors:
For stale leads:

follow_up_lead

update_lead_status → "contacted"

log_lead_follow_up

For scheduling trials:

schedule_trial

log_event(type="trial_scheduled")

For high‑quality leads:

Logs and prepares outreach (mock for now)

For `inactive_lead` tasks:

Load the lead, persist computed `inactivity_bucket`, run `plan_outreach_sequence`

On follow‑up / final nudge: `follow_up_lead`, update `status` / `last_contacted_at`, `log_lead_follow_up`, emit `lead_followed_up`

On mark lost: `update_lead_status` → `lost`, emit `lead_marked_lost`

For `inactive_trial` tasks:

Load the trial, persist computed `inactivity_bucket`, run `plan_trial_sequence`

On confirm: `send_trial_reminder`, `update_trial_status` → `confirmed` + `last_reminded_at`, emit `trial_confirmed`

On follow‑up / final nudge: `send_trial_reminder` + `trial_follow_up` / `trial_final_nudge` events

On mark lost: `update_trial_status` → `lost`, emit `trial_marked_lost`

For `trial_to_enrollment` tasks:

`create_enrollment` (idempotent by `lead_id`), emit `student_enrolled`

`plan_onboarding_sequence` → mock `send_onboarding_message`, `update_student` stage transitions, events (`onboarding_welcome_sent`, `onboarding_checkin_sent`, `retention_nudge_sent` as applicable)

`update_trial_status` → `enrolled` on the source trial

For `at_risk_student` tasks:

Load student by id, run `plan_retention_sequence` (passes `missed_in_last_30_days` for thresholding)

`retention_nudge`: mock `send_onboarding_message`, `update_student` → `onboarding_stage: at_risk`, `churn_risk: high`, emit `retention_nudge_sent`

`check_in`: mock `send_onboarding_message`, emit `attendance_checkin_sent`

#️⃣ 6. Tools (Complete List)
Supabase Read Tools
get_leads (optional `filter: { id }`)

get_trials (optional `filter: { id }`; normalizes `scheduled_at` from `scheduled_at` or legacy `time`)

get_students

get_kpis

get_tenant_settings

Supabase Write Tools
update_lead_status

log_lead_follow_up

schedule_trial

update_trial_status

create_enrollment (inserts `students` row for a `lead_id`)

update_student

log_event

log_tenant_event

compute_tenant_kpis (wraps `get_kpis` + weighted `score` from `kpi_settings`)

Intelligence Tools
score_lead

prioritize_trials

compute_lead_aging (thresholds from `tenant_settings.lead_pipeline`)

detect_inactive_leads

plan_outreach_sequence (`contacted` + inactivity `dead` → `mark_lost`; otherwise generic follow‑up for `new` / `contacted`; uses tenant‑aware lead aging)

compute_trial_aging (thresholds from `tenant_settings.trial_pipeline`)

detect_inactive_trials

plan_trial_sequence (`completed` → post‑trial enrollment nudge; `scheduled` + aging `dead` → `mark_lost`; `scheduled` otherwise → confirm; else final nudge vs lost by aging; uses tenant‑aware trial aging)

detect_trial_to_enrollment

plan_onboarding_sequence

detect_at_risk_students (reads `attendance` per student; flags `at_risk` health or `warning` + `first_week` onboarding)

plan_retention_sequence (optional `missed_in_last_30_days`; `missed ≥ 3` or stage / churn → nudge; `first_week` → attendance check‑in)

Operational Tools
follow_up_lead

send_trial_reminder

send_onboarding_message

System Tools
enqueue_task (queues `{ name: agentId, payload }` for the runtime worker)

#️⃣ 7. Workflows Implemented
7.1 Lead Pipeline
Fetch leads

Score leads

Detect high‑quality leads

Detect stale leads

Follow up on stale leads

Compute aging (`compute_lead_aging`) and detect cold/dead inactivity (`detect_inactive_leads`)

Plan outreach (`plan_outreach_sequence`) and delegate inactive leads to the enrollment coordinator

Follow up on inactive leads or mark lost; emit standardized lifecycle events

Update lead status

Log follow‑ups

7.2 Trial Pipeline
Fetch trials

Prioritize trials

Detect low trial volume

Compute trial aging (`compute_trial_aging`) and detect stale/dead trials (`detect_inactive_trials`)

Plan sequences (`plan_trial_sequence`) and delegate inactive trials to the enrollment coordinator

Schedule trials (real)

Log trial events

Send trial reminders (mock for now); confirm, follow‑up, nudge, or mark lost with `update_trial_status`

7.3 KPI Pipeline
Fetch students, leads, trials

Compute KPIs

Emit KPI snapshot events

7.4 Enrollment pipeline
Detect completed attended trials ready for enrollment

Create student records (`create_enrollment`) and first‑step onboarding (`plan_onboarding_sequence`, mock `send_onboarding_message`)

Update onboarding stage and trial status to `enrolled`; emit enrollment lifecycle events

7.5 Retention pipeline
Record lesson outcomes in `attendance` (`present` / date per student)

Compute missed lessons in rolling 30 days (`computeAttendanceHealth`)

Detect students needing follow‑up (`detect_at_risk_students`) → `at_risk_student` tasks + `student_at_risk_detected`

Plan retention or first‑week check‑in (`plan_retention_sequence`) → mock `send_onboarding_message`, `update_student` when nudging churn, events `retention_nudge_sent` / `attendance_checkin_sent`

7.6 Multi‑tenant pipeline behavior (Bundle 14)
Per‑tenant `tenant_settings` row drives pipeline toggles, aging thresholds, KPI weights, dashboard tick cadence, and optional event suppression.

Dashboard and coordinator paths call `get_tenant_settings` (directly or through helpers) so automation stays configurable without redeploying code.

#️⃣ 8. Bundles Completed
Runtime + agent system

Task queue

Event bus

Tool registry

KPI rules

Lead scoring + trial prioritization

Follow‑up logic + reminders

Real Supabase reads

Real Supabase writes

Bundle 10 — self‑driving lead pipeline (aging, inactivity detection, outreach planning, coordinator follow‑up / lost)

Bundle 11 — trial pipeline automation (trial aging, inactive trial detection, sequence planning, coordinator actions, lifecycle events)

Bundle 12 — enrollment pipeline automation (trial→enrollment detection, student create, onboarding sequence, lifecycle events)

Bundle 13 — retention pipeline (`attendance` table, attendance health, at‑risk detection, retention / check‑in actions)

Bundle 14 — multi‑tenant SaaS layer (`tenant_settings`, `get_tenant_settings`, tenant‑tunable aging/KPIs/schedule, pipeline toggles, `log_tenant_event` filtering)

#️⃣ 9. Next Bundles (Roadmap)
Bundle 15 — UI Layer (Optional for MVP)
Dashboard

Activity feed

Agent logs

KPI cards

Lead/trial views

#️⃣ 10. Summary
ZiroWork is a multi‑tenant, agent‑driven automation engine with:

Real Supabase reads and writes across **leads**, **trials**, and **students**

Four coordinated pipelines: **leads** (Bundle 10), **trials** (Bundle 11), **enrollment** (Bundle 12), **retention** (Bundle 13), orchestrated by the **dashboard** agent and executed largely by the **enrollment coordinator**, each tunable and toggleable per tenant via **Bundle 14** settings.

Intelligence and operational tools (scoring, aging, detection, planning, reminders, onboarding / retention mocks) registered in `src/lib/agents/init.ts`

A **task queue** plus **event bus** (`emit` / `subscribe`) for in-process coordination, and **`log_tenant_event`** (with optional suppression) for durable pipeline telemetry

This architecture is stable, scalable, and ready for the next phase: admin UI for `tenant_settings`, deduping recurring retention tasks, production scheduling instead of client `dashboard_tick`, and a product UI on top of the same tools and events.


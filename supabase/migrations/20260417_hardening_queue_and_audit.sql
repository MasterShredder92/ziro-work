-- ---------------------------------------------------------------------------
-- Final Cleanup + Production Hardening Bundle
-- Tables for: background jobs, dead-letter queue, rate-limit audit trail
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- jobs: durable, poll-driven job table (no external broker)
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid null,
    kind text not null,                  -- e.g. "messaging.delivery", "automation.action", "export.report"
    payload jsonb not null default '{}'::jsonb,
    status text not null default 'pending',   -- pending | running | succeeded | failed | dead
    priority smallint not null default 100,
    run_at timestamptz not null default now(),
    attempts smallint not null default 0,
    max_attempts smallint not null default 5,
    last_error text null,
    locked_by text null,
    locked_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz null
);

create index if not exists jobs_status_runat_idx
    on public.jobs (status, run_at)
    where status in ('pending', 'running');

create index if not exists jobs_kind_status_idx
    on public.jobs (kind, status);

create index if not exists jobs_tenant_idx
    on public.jobs (tenant_id);

-- ---------------------------------------------------------------------------
-- job_runs: per-attempt audit trail
-- ---------------------------------------------------------------------------
create table if not exists public.job_runs (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references public.jobs(id) on delete cascade,
    attempt smallint not null,
    status text not null,                -- running | succeeded | failed
    started_at timestamptz not null default now(),
    finished_at timestamptz null,
    duration_ms integer null,
    error_code text null,
    error_message text null,
    log jsonb null
);

create index if not exists job_runs_job_idx on public.job_runs (job_id, attempt);

-- ---------------------------------------------------------------------------
-- dead_letter_jobs: terminal failures for manual review
-- ---------------------------------------------------------------------------
create table if not exists public.dead_letter_jobs (
    id uuid primary key default gen_random_uuid(),
    original_job_id uuid not null,
    tenant_id uuid null,
    kind text not null,
    payload jsonb not null default '{}'::jsonb,
    attempts smallint not null,
    last_error text null,
    failed_at timestamptz not null default now(),
    reviewed_at timestamptz null,
    reviewed_by uuid null
);

create index if not exists dead_letter_jobs_kind_idx on public.dead_letter_jobs (kind);
create index if not exists dead_letter_jobs_tenant_idx on public.dead_letter_jobs (tenant_id);

-- ---------------------------------------------------------------------------
-- rate_limit_hits: audit trail for tripped policies
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limit_hits (
    id uuid primary key default gen_random_uuid(),
    policy_id text not null,
    tenant_id uuid null,
    ip text null,
    route text null,
    key text not null,
    max_allowed integer not null,
    window_ms integer not null,
    created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_policy_idx
    on public.rate_limit_hits (policy_id, created_at desc);

create index if not exists rate_limit_hits_tenant_idx
    on public.rate_limit_hits (tenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- security_events: structured log sink for sensitive events
-- ---------------------------------------------------------------------------
create table if not exists public.security_events (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid null,
    actor_id uuid null,
    event text not null,                 -- "auth.login.failure", "csrf.reject", etc.
    severity text not null default 'info',
    ip text null,
    user_agent text null,
    request_id text null,
    details jsonb null,
    created_at timestamptz not null default now()
);

create index if not exists security_events_event_idx
    on public.security_events (event, created_at desc);

create index if not exists security_events_tenant_idx
    on public.security_events (tenant_id, created_at desc);

-- Automation OS foundation tables for normalized trigger/action definitions.

create table if not exists automation_workflows (
  id text primary key,
  tenant_id text not null,
  name text not null,
  enabled boolean not null default true,
  trigger jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  description text null,
  retry_max integer not null default 3,
  retry_backoff_ms integer not null default 1000,
  concurrency_limit integer null,
  tags text[] not null default '{}',
  created_by text null,
  last_run_at timestamptz null,
  last_run_status text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_triggers (
  id text primary key,
  tenant_id text not null,
  workflow_id text not null references automation_workflows(id) on delete cascade,
  type text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_actions (
  id text primary key,
  tenant_id text not null,
  workflow_id text not null references automation_workflows(id) on delete cascade,
  action_order integer not null default 0,
  type text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_runs (
  id text primary key,
  tenant_id text not null,
  workflow_id text not null references automation_workflows(id) on delete cascade,
  trigger_type text not null,
  status text not null default 'queued',
  started_at timestamptz not null default now(),
  finished_at timestamptz null,
  duration_ms integer null,
  payload jsonb not null default '{}'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  logs jsonb not null default '[]'::jsonb,
  attempt integer not null default 0,
  max_attempts integer not null default 3,
  error jsonb null,
  triggered_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists automation_runs
  add column if not exists logs jsonb not null default '[]'::jsonb;

create index if not exists idx_automation_workflows_tenant
  on automation_workflows (tenant_id);

create index if not exists idx_automation_triggers_workflow
  on automation_triggers (workflow_id);

create index if not exists idx_automation_actions_workflow_order
  on automation_actions (workflow_id, action_order);

create index if not exists idx_automation_runs_workflow
  on automation_runs (workflow_id, created_at desc);

create index if not exists idx_automation_runs_status
  on automation_runs (tenant_id, status);

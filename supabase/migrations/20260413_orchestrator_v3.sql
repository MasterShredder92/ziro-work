-- ======================================================================
-- ORCHESTRATOR V3 — STAR Operating Model Alignment
-- Adds governance fields, task persistence tables, and visibility layer.
-- Safe: CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS throughout.
-- ======================================================================

-- ── 1. Agent governance columns ──

alter table agents add column if not exists is_visible_in_ui boolean default true;
alter table agents add column if not exists is_archived boolean default false;
alter table agents add column if not exists business_context text default 'music_school';

create index if not exists idx_agents_visible on agents(is_visible_in_ui) where is_visible_in_ui = true;
create index if not exists idx_agents_business_ctx on agents(business_context);

-- ── 2. Skill governance columns ──

alter table skills add column if not exists is_active boolean default true;
alter table skills add column if not exists business_context text default 'music_school';

create index if not exists idx_skills_active on skills(is_active) where is_active = true;

-- ── 3. Template governance columns ──

alter table agent_templates add column if not exists business_context text default 'music_school';

create index if not exists idx_templates_business_ctx on agent_templates(business_context);

-- ── 4. Task Threads — one clean thread per task ──

create table if not exists task_threads (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references agent_tasks(id) on delete cascade,
  agent_id uuid references agents(id) on delete set null,
  parent_chat_id uuid,
  thread_title text not null,
  started_at timestamptz default now(),
  ended_at timestamptz,
  status text default 'open' check (status in ('open','closed','archived')),
  summary text,
  created_at timestamptz default now()
);

create index if not exists idx_task_threads_task on task_threads(task_id);
create index if not exists idx_task_threads_agent on task_threads(agent_id);
create index if not exists idx_task_threads_status on task_threads(status);

-- ── 5. Task Messages — clean message stream per thread ──

create table if not exists task_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references task_threads(id) on delete cascade,
  sender_type text not null check (sender_type in ('user','star','agent','system')),
  sender_name text,
  message_type text not null default 'instruction'
    check (message_type in ('instruction','tool_call','result','error','review','status')),
  content text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_task_messages_thread on task_messages(thread_id);
create index if not exists idx_task_messages_created on task_messages(created_at);

-- ── 6. Task Artifacts — structured artifact storage ──

create table if not exists task_artifacts (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references agent_tasks(id) on delete cascade,
  run_id uuid references task_runs(id) on delete set null,
  artifact_type text not null default 'file'
    check (artifact_type in ('file','url','screenshot','log','diff','report','other')),
  title text not null,
  url_or_path text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_task_artifacts_task on task_artifacts(task_id);
create index if not exists idx_task_artifacts_run on task_artifacts(run_id);

-- ── 7. Task Failures — failure diagnostics ──

create table if not exists task_failures (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references agent_tasks(id) on delete cascade,
  run_id uuid references task_runs(id) on delete set null,
  failure_stage text not null,
  error_code text,
  error_message text,
  recoverable boolean default true,
  recovery_action text,
  created_at timestamptz default now()
);

create index if not exists idx_task_failures_task on task_failures(task_id);
create index if not exists idx_task_failures_run on task_failures(run_id);
create index if not exists idx_task_failures_stage on task_failures(failure_stage);

-- ── 8. Agent Tasks — add thread linkage ──

alter table agent_tasks add column if not exists thread_id uuid references task_threads(id) on delete set null;

-- ── 9. Backfill existing data with music_school context ──
-- Safe: only updates rows that still have the default or null.

update agents set business_context = 'music_school' where business_context is null;
update skills set business_context = 'music_school' where business_context is null;
update agent_templates set business_context = 'music_school' where business_context is null;

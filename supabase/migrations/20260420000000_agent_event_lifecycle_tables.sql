-- ZiroWork Audit Fix: Create missing agent orchestration and lifecycle tables
-- Migration: 20260420000000_agent_event_lifecycle_tables.sql

-- 1. agentpermissionprofiles
create table if not exists public.agentpermissionprofiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  can_read jsonb not null default '[]'::jsonb,
  can_write jsonb not null default '[]'::jsonb,
  can_trigger_events jsonb not null default '[]'::jsonb,
  can_call_tools jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agentpermissionprofiles enable row level security;
create policy "tenant_isolation" on public.agentpermissionprofiles
  for all using (true);

-- 2. agenttoolassignments
create table if not exists public.agenttoolassignments (
  id uuid primary key default gen_random_uuid(),
  agentid uuid not null references public.ziro_agents(id) on delete cascade,
  skillid uuid references public.ziro_skills(id) on delete set null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.agenttoolassignments enable row level security;
create policy "tenant_isolation" on public.agenttoolassignments
  for all using (true);

-- 3. agenteventsubscriptions
create table if not exists public.agenteventsubscriptions (
  id uuid primary key default gen_random_uuid(),
  agentid uuid not null references public.ziro_agents(id) on delete cascade,
  eventname text not null,
  filter jsonb,
  priority int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.agenteventsubscriptions enable row level security;
create policy "tenant_isolation" on public.agenteventsubscriptions
  for all using (true);

-- 4. agent_tasks
create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agentid uuid not null references public.ziro_agents(id) on delete cascade,
  eventid uuid,
  state text not null default 'pending',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

alter table public.agent_tasks enable row level security;
create policy "tenant_isolation" on public.agent_tasks
  for all using (true);

-- 5. agreements
create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  tenantid text not null references public.tenants(id) on delete cascade,
  studentid uuid references public.students(id) on delete set null,
  url text,
  signed boolean not null default false,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.agreements enable row level security;
create policy "tenant_isolation" on public.agreements
  for all using (tenantid = current_setting('app.tenant_id', true));

-- 6. lessons
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  studentid uuid references public.students(id) on delete set null,
  teacherid uuid references public.teachers(id) on delete set null,
  schedule_block_id uuid references public.schedule_blocks(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

alter table public.lessons enable row level security;
create policy "tenant_isolation" on public.lessons
  for all using (true);

-- 7. lesson_notes
create table if not exists public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  lessonid uuid references public.lessons(id) on delete cascade,
  agentid uuid references public.ziro_agents(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.lesson_notes enable row level security;
create policy "tenant_isolation" on public.lesson_notes
  for all using (true);

-- 8. portalsessions
create table if not exists public.portalsessions (
  id uuid primary key default gen_random_uuid(),
  tenantid text not null references public.tenants(id) on delete cascade,
  userid uuid references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table public.portalsessions enable row level security;
create policy "tenant_isolation" on public.portalsessions
  for all using (tenantid = current_setting('app.tenant_id', true));

-- 9. review_requests
create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  tenantid text not null references public.tenants(id) on delete cascade,
  studentid uuid references public.students(id) on delete set null,
  status text not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.review_requests enable row level security;
create policy "tenant_isolation" on public.review_requests
  for all using (tenantid = current_setting('app.tenant_id', true));

-- 10. ALTER ziro_agents: add missing spec columns
alter table public.ziro_agents
  add column if not exists tenantscope text not null default 'pertenant',
  add column if not exists capabilities jsonb not null default '[]'::jsonb,
  add column if not exists permissionsprofileid uuid references public.agentpermissionprofiles(id) on delete set null,
  add column if not exists purpose text,
  add column if not exists profile_summary text,
  add column if not exists lifecycle_type text,
  add column if not exists usage_triggers jsonb not null default '[]'::jsonb,
  add column if not exists invocation_rules jsonb not null default '{}'::jsonb,
  add column if not exists business_context text,
  add column if not exists auto_use_by_ziro boolean not null default false,
  add column if not exists is_visible_in_ui boolean not null default true,
  add column if not exists is_archived boolean not null default false,
  add column if not exists last_used_at timestamptz,
  add column if not exists retired_at timestamptz;

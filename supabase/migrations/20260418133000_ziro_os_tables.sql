-- Ziro OS tables on Lessonpreneur production project
-- Adds agent/session/automation runtime tables with tenant-scoped RLS.

create table if not exists public.ziro_agents (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  code text not null,
  name text not null,
  role text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ziro_agents_tenant_code_uq unique (tenant_id, code),
  constraint ziro_agents_tenant_fk
    foreign key (tenant_id) references public.tenants(id) on delete cascade
);

create table if not exists public.ziro_skills (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  agent_id uuid references public.ziro_agents(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ziro_skills_tenant_slug_uq unique (tenant_id, slug),
  constraint ziro_skills_tenant_fk
    foreign key (tenant_id) references public.tenants(id) on delete cascade
);

create table if not exists public.ziro_tools (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  skill_id uuid references public.ziro_skills(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ziro_tools_tenant_slug_uq unique (tenant_id, slug),
  constraint ziro_tools_tenant_fk
    foreign key (tenant_id) references public.tenants(id) on delete cascade
);

create table if not exists public.ziro_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  agent_id uuid references public.ziro_agents(id) on delete set null,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  channel text not null default 'app',
  status text not null default 'open',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ziro_sessions_tenant_fk
    foreign key (tenant_id) references public.tenants(id) on delete cascade
);

create table if not exists public.ziro_automations (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  agent_id uuid references public.ziro_agents(id) on delete set null,
  name text not null,
  trigger_type text not null,
  status text not null default 'active',
  config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ziro_automations_tenant_fk
    foreign key (tenant_id) references public.tenants(id) on delete cascade
);

create table if not exists public.ziro_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  session_id uuid references public.ziro_sessions(id) on delete cascade,
  automation_id uuid references public.ziro_automations(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint ziro_events_tenant_fk
    foreign key (tenant_id) references public.tenants(id) on delete cascade
);

create table if not exists public.ziro_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  session_id uuid references public.ziro_sessions(id) on delete cascade,
  level text not null default 'info',
  message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ziro_logs_tenant_fk
    foreign key (tenant_id) references public.tenants(id) on delete cascade
);

create table if not exists public.ziro_settings (
  tenant_id text primary key,
  settings jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ziro_settings_tenant_fk
    foreign key (tenant_id) references public.tenants(id) on delete cascade
);

create index if not exists ziro_agents_tenant_idx on public.ziro_agents (tenant_id);
create index if not exists ziro_agents_status_idx on public.ziro_agents (status);
create index if not exists ziro_skills_tenant_idx on public.ziro_skills (tenant_id);
create index if not exists ziro_skills_agent_idx on public.ziro_skills (agent_id);
create index if not exists ziro_tools_tenant_idx on public.ziro_tools (tenant_id);
create index if not exists ziro_tools_skill_idx on public.ziro_tools (skill_id);
create index if not exists ziro_sessions_tenant_idx on public.ziro_sessions (tenant_id);
create index if not exists ziro_sessions_agent_idx on public.ziro_sessions (agent_id);
create index if not exists ziro_sessions_owner_idx on public.ziro_sessions (owner_profile_id);
create index if not exists ziro_automations_tenant_idx on public.ziro_automations (tenant_id);
create index if not exists ziro_automations_agent_idx on public.ziro_automations (agent_id);
create index if not exists ziro_events_tenant_created_idx on public.ziro_events (tenant_id, created_at desc);
create index if not exists ziro_events_session_idx on public.ziro_events (session_id);
create index if not exists ziro_events_type_idx on public.ziro_events (event_type);
create index if not exists ziro_logs_tenant_created_idx on public.ziro_logs (tenant_id, created_at desc);
create index if not exists ziro_logs_session_idx on public.ziro_logs (session_id);
create index if not exists ziro_logs_level_idx on public.ziro_logs (level);

alter table public.ziro_agents enable row level security;
alter table public.ziro_skills enable row level security;
alter table public.ziro_tools enable row level security;
alter table public.ziro_sessions enable row level security;
alter table public.ziro_automations enable row level security;
alter table public.ziro_events enable row level security;
alter table public.ziro_logs enable row level security;
alter table public.ziro_settings enable row level security;

do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'ziro_agents',
      'ziro_skills',
      'ziro_tools',
      'ziro_sessions',
      'ziro_automations',
      'ziro_events',
      'ziro_logs',
      'ziro_settings'
    ])
  loop
    execute format('drop policy if exists "%s_tenant_header_all" on public.%I', tbl, tbl);
    execute format(
      $p$create policy "%s_tenant_header_all" on public.%I
        for all
        using (tenant_id = (current_setting('request.headers', true)::json ->> 'x-tenant-id'))
        with check (tenant_id = (current_setting('request.headers', true)::json ->> 'x-tenant-id'))$p$,
      tbl, tbl
    );
  end loop;
end $$;

-- ══════════════════════════════════════════════════════════
-- ORCHESTRATOR V1 SCHEMA
-- Skills, Agent Templates, Task Runs, STAR Reviews
-- ══════════════════════════════════════════════════════════

-- ── Skills ──
create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  prompt_fragment text not null,
  runtime text not null default 'claude_code',
  tags text[] default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_skills_slug on skills(slug);
create index if not exists idx_skills_runtime on skills(runtime);

-- ── Agent Templates ──
create table if not exists agent_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  base_prompt text not null,
  supported_runtimes text[] default '{claude_code}',
  max_skills integer default 4,
  task_types text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_agent_templates_slug on agent_templates(slug);
create index if not exists idx_agent_templates_active on agent_templates(is_active);

-- ── Agent Template → Skills (join table) ──
create table if not exists agent_template_skills (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references agent_templates(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  priority integer default 0,
  unique(template_id, skill_id)
);

create index if not exists idx_ats_template on agent_template_skills(template_id);
create index if not exists idx_ats_skill on agent_template_skills(skill_id);

-- ── Task Runs ──
create table if not exists task_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references agent_tasks(id) on delete set null,
  template_id uuid references agent_templates(id) on delete set null,
  agent_id uuid references agents(id) on delete set null,
  runtime text not null default 'claude_code',
  skill_ids uuid[] default '{}',
  composed_prompt text,
  status text default 'pending',
  result text,
  tokens_used integer,
  duration_ms integer,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists idx_task_runs_task on task_runs(task_id);
create index if not exists idx_task_runs_status on task_runs(status);
create index if not exists idx_task_runs_created on task_runs(created_at);

-- ── STAR Reviews ──
create table if not exists star_reviews (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references task_runs(id) on delete cascade,
  summary text not null,
  what_worked text[] default '{}',
  what_failed text[] default '{}',
  next_action text,
  verdict text not null default 'needs_review',
  created_at timestamptz default now()
);

create index if not exists idx_star_reviews_run on star_reviews(run_id);
create index if not exists idx_star_reviews_verdict on star_reviews(verdict);

-- ── Extend agent_tasks with orchestrator fields ──
alter table agent_tasks add column if not exists retry_count integer default 0;
alter table agent_tasks add column if not exists task_type text;
alter table agent_tasks add column if not exists template_id uuid references agent_templates(id) on delete set null;
alter table agent_tasks add column if not exists runtime text default 'claude_code';
alter table agent_tasks add column if not exists routed_at timestamptz;
alter table agent_tasks add column if not exists updated_at timestamptz default now();

create index if not exists idx_agent_tasks_status on agent_tasks(status);
create index if not exists idx_agent_tasks_task_type on agent_tasks(task_type);

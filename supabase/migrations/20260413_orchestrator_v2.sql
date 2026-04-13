-- ══════════════════════════════════════════════════════════
-- ORCHESTRATOR V2 — Schema alignment
-- Adds missing columns to agents, agent_tasks, task_runs
-- Safe: all ADD COLUMN IF NOT EXISTS
-- ══════════════════════════════════════════════════════════

-- ── Agents: add orchestrator columns ──
alter table agents add column if not exists template_id uuid references agent_templates(id) on delete set null;
alter table agents add column if not exists mode text default 'persistent';
alter table agents add column if not exists current_load integer default 0;
alter table agents add column if not exists last_heartbeat_at timestamptz;
alter table agents add column if not exists created_by text;
alter table agents add column if not exists reason_created text;
alter table agents add column if not exists approved_by text;
alter table agents add column if not exists updated_at timestamptz default now();

create index if not exists idx_agents_template on agents(template_id);
create index if not exists idx_agents_mode on agents(mode);

-- ── Agent Tasks: add full orchestrator columns ──
-- (retry_count, task_type, runtime, updated_at already added in v1)
alter table agent_tasks add column if not exists goal_id uuid;
alter table agent_tasks add column if not exists project_id uuid;
alter table agent_tasks add column if not exists agent_template_id uuid references agent_templates(id) on delete set null;
alter table agent_tasks add column if not exists skill_ids uuid[] default '{}';
alter table agent_tasks add column if not exists budget_tokens integer;
alter table agent_tasks add column if not exists budget_dollars numeric;
alter table agent_tasks add column if not exists priority integer default 0;
alter table agent_tasks add column if not exists review_summary text;
alter table agent_tasks add column if not exists review_status text;
alter table agent_tasks add column if not exists artifact_urls text[] default '{}';
alter table agent_tasks add column if not exists failure_stage text;
alter table agent_tasks add column if not exists started_at timestamptz;

create index if not exists idx_agent_tasks_template on agent_tasks(agent_template_id);
create index if not exists idx_agent_tasks_priority on agent_tasks(priority);

-- ── Task Runs: add missing execution columns ──
alter table task_runs add column if not exists attempt_number integer default 1;
alter table task_runs add column if not exists worker_id text;
alter table task_runs add column if not exists input_snapshot text;
alter table task_runs add column if not exists result_snapshot text;
alter table task_runs add column if not exists tokens_in integer;
alter table task_runs add column if not exists tokens_out integer;
alter table task_runs add column if not exists estimated_cost numeric;
alter table task_runs add column if not exists error_message text;

create index if not exists idx_task_runs_worker on task_runs(worker_id);
create index if not exists idx_task_runs_attempt on task_runs(task_id, attempt_number);

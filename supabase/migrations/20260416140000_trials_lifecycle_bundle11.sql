-- Bundle 11: trial lifecycle + aging (orchestrator DB)
-- Safe: CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS.

create table if not exists public.trials (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  student_id uuid,
  "time" timestamptz,
  created_at timestamptz default now()
);

alter table public.trials
  add column if not exists status text default 'scheduled',
  add column if not exists last_reminded_at timestamptz,
  add column if not exists inactivity_bucket text,
  add column if not exists attended boolean,
  add column if not exists enrollment_decision text,
  add column if not exists scheduled_at timestamptz,
  add column if not exists lead_id uuid;

update public.trials
set scheduled_at = coalesce(scheduled_at, "time")
where scheduled_at is null and "time" is not null;

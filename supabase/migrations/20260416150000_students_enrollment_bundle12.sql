-- Bundle 12: student onboarding + attendance fields (orchestrator DB)
-- Safe: CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS.

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  lead_id uuid,
  created_at timestamptz default now()
);

alter table public.students
  add column if not exists enrollment_date timestamptz,
  add column if not exists onboarding_stage text,
  add column if not exists last_attendance_at timestamptz,
  add column if not exists attendance_streak int default 0,
  add column if not exists churn_risk text,
  add column if not exists lead_id uuid;

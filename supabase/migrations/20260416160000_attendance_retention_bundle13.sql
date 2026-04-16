-- Bundle 13: attendance log + retention (aligns with existing text tenant_id)
-- Safe: CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS.

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  student_id uuid not null references public.students (id) on delete cascade,
  lesson_date timestamptz not null,
  present boolean not null,
  created_at timestamptz default now()
);

create index if not exists idx_attendance_tenant_student on public.attendance (tenant_id, student_id);
create index if not exists idx_attendance_lesson_date on public.attendance (lesson_date desc);

alter table public.students
  add column if not exists last_attendance_at timestamptz,
  add column if not exists attendance_streak int default 0,
  add column if not exists churn_risk text;

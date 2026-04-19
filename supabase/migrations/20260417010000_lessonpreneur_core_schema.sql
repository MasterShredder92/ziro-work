-- Lessonpreneur canonical core schema (deterministic baseline).
-- Consolidates lead/trial/attendance/tenant settings + core CRM/ops tables.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  primary_contact_id uuid,
  primary_email text,
  primary_phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  status text not null default 'active'
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  family_id uuid references public.families(id) on delete set null,
  teacher_id uuid references public.teachers(id) on delete set null,
  lead_id uuid,
  first_name text not null default '',
  last_name text not null default '',
  email text,
  phone text,
  status text not null default 'active',
  enrollment_date timestamptz,
  onboarding_stage text,
  last_attendance_at timestamptz,
  attendance_streak int default 0,
  churn_risk text
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  student_id uuid references public.students(id) on delete set null,
  name text,
  email text,
  phone text,
  status text not null default 'new',
  source text,
  stage text,
  last_contacted_at timestamptz,
  inactivity_bucket text
);

create table if not exists public.trials (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  student_id uuid references public.students(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  scheduled_at timestamptz,
  status text default 'scheduled',
  attended boolean,
  last_reminded_at timestamptz,
  inactivity_bucket text,
  enrollment_decision text
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  student_id uuid not null references public.students(id) on delete cascade,
  lesson_date timestamptz not null,
  present boolean not null
);

create table if not exists public.tenant_settings (
  tenant_id text primary key,
  lead_pipeline jsonb default '{}'::jsonb,
  trial_pipeline jsonb default '{}'::jsonb,
  enrollment_pipeline jsonb default '{}'::jsonb,
  retention_pipeline jsonb default '{}'::jsonb,
  kpi_settings jsonb default '{}'::jsonb,
  schedule jsonb default '{}'::jsonb,
  pipelines jsonb default '{"lead": true, "trial": true, "enrollment": true, "retention": true}'::jsonb,
  events jsonb default '{"disabled": []}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  start_date date,
  end_date date,
  status text not null default 'active'
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled'
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  family_id uuid references public.families(id) on delete set null,
  amount_cents integer not null default 0,
  currency text not null default 'USD',
  status text not null default 'draft',
  due_at timestamptz
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  invoice_id uuid references public.invoices(id) on delete set null,
  amount_cents integer not null default 0,
  currency text not null default 'USD',
  method text,
  status text not null default 'pending',
  paid_at timestamptz
);

create table if not exists public.lifecycle (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  entity_type text not null,
  entity_id uuid not null,
  stage text not null,
  previous_stage text,
  changed_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  entity_type text not null,
  entity_id uuid not null,
  author_id uuid,
  body text not null
);

create index if not exists families_tenant_id_idx on public.families (tenant_id);
create index if not exists teachers_tenant_id_idx on public.teachers (tenant_id);
create index if not exists students_tenant_id_idx on public.students (tenant_id);
create index if not exists students_family_id_idx on public.students (family_id);
create index if not exists students_lead_id_idx on public.students (lead_id);
create index if not exists leads_tenant_status_idx on public.leads (tenant_id, status);
create index if not exists trials_tenant_status_idx on public.trials (tenant_id, status);
create index if not exists attendance_tenant_student_date_idx on public.attendance (tenant_id, student_id, lesson_date desc);
create index if not exists enrollments_tenant_id_idx on public.enrollments (tenant_id);
create index if not exists schedules_tenant_starts_at_idx on public.schedules (tenant_id, starts_at);
create index if not exists invoices_tenant_id_idx on public.invoices (tenant_id);
create index if not exists payments_tenant_id_idx on public.payments (tenant_id);
create index if not exists lifecycle_tenant_id_idx on public.lifecycle (tenant_id);
create index if not exists notes_tenant_id_idx on public.notes (tenant_id);

do $$
declare
  t text;
  tables text[] := array[
    'families','teachers','students','leads','trials','attendance',
    'enrollments','schedules','invoices','payments','lifecycle','notes'
  ];
begin
  foreach t in array tables loop
    execute format(
      'drop trigger if exists set_updated_at_%1$I on public.%1$I;',
      t
    );
    execute format(
      'create trigger set_updated_at_%1$I before update on public.%1$I for each row execute function public.set_updated_at();',
      t
    );
  end loop;
end
$$;

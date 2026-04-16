-- Bundle 14: per-tenant automation settings (JSONB columns)
-- Safe: CREATE TABLE IF NOT EXISTS.

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

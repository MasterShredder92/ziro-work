-- Lead lifecycle + aging fields (ZiroWork orchestrator DB)
-- Safe to run multiple times.

alter table public.leads
  add column if not exists status text default 'new',
  add column if not exists last_contacted_at timestamptz,
  add column if not exists inactivity_bucket text;

-- Optional: enrich follow-up logs with a reason (safe if table exists)
alter table public.lead_followups
  add column if not exists reason text;

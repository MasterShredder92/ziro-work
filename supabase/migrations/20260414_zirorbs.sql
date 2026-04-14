-- Zirorbs: organizational clusters for specialist agents (under Star).
-- Agents belong to at most one Zirorb; skills remain on agents.

create table if not exists zirorbs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  family text not null default 'vertical' check (family in ('core', 'vertical')),
  accent_color text not null default '#00ff88',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_zirorbs_family_sort on zirorbs (family, sort_order);
create index if not exists idx_zirorbs_sort on zirorbs (sort_order);

alter table agents add column if not exists zirorb_id uuid references zirorbs (id) on delete set null;

create index if not exists idx_agents_zirorb_id on agents (zirorb_id);

comment on table zirorbs is 'Visual/domain grouping for specialist agents; Star is not assigned to a Zirorb.';
comment on column agents.zirorb_id is 'FK to zirorbs; null means Unassigned bucket in UI.';

-- Seed initial Zirorbs (idempotent)
insert into zirorbs (slug, name, description, family, accent_color, sort_order)
values
  ('core', 'Core', 'Platform, product, and reliability intelligence.', 'core', '#f59e0b', 0),
  ('music-school', 'Music School', 'Enrollment, scheduling, retention, and family comms.', 'vertical', '#a855f7', 10),
  ('sales', 'Sales', 'Pipeline, outreach, and revenue motion.', 'vertical', '#00ff88', 20),
  ('content', 'Content', 'Narrative, creative, and distribution.', 'vertical', '#3b82f6', 30)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  family = excluded.family,
  accent_color = excluded.accent_color,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Best-effort assignment for known roster (no-op if agents missing)
update agents a
set zirorb_id = z.id,
    updated_at = coalesce(a.updated_at, now())
from zirorbs z
where z.slug = 'core'
  and a.slug <> 'star'
  and (
    lower(a.slug) in ('forge', 'ops', 'ui', 'qa', 'lead-qualifier')
    or lower(trim(a.name)) in (
      'forge',
      'ops',
      'ui',
      'qa',
      'lead qualifier'
    )
  );

update agents a
set zirorb_id = z.id,
    updated_at = coalesce(a.updated_at, now())
from zirorbs z
where z.slug = 'music-school'
  and a.slug <> 'star'
  and (
    lower(a.slug) in (
      'closer',
      'enrollment-coordinator',
      'scheduling-placement',
      'retention',
      'reactivation',
      'billing-recovery',
      'parent-communication'
    )
    or lower(trim(a.name)) in (
      'closer',
      'enrollment coordinator',
      'scheduling / placement',
      'retention',
      'reactivation',
      'billing / recovery',
      'parent communication'
    )
  );

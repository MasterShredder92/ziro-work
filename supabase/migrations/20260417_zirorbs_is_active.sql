-- Zirorb activation: hide from routing/UI emphasis without deleting (default all active).
alter table zirorbs add column if not exists is_active boolean not null default true;

comment on column zirorbs.is_active is 'When false, Zirorb is dormant: shown dimmed on org map; routing should prefer active Orbs.';

update zirorbs set is_active = true where is_active is null;

create schema if not exists scheduling;

create table if not exists scheduling.schedules (
  id uuid primary key default gen_random_uuid(),
  "tenantId" text not null,
  name text not null,
  color text not null default '#22c55e',
  "createdAt" timestamptz not null default now()
);

create table if not exists scheduling.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  "scheduleId" uuid not null references scheduling.schedules(id) on delete cascade,
  "dayOfWeek" integer not null check ("dayOfWeek" between 0 and 6),
  "startTime" time not null,
  "endTime" time not null,
  constraint availability_blocks_time_range_ck check ("endTime" > "startTime")
);

create table if not exists scheduling.appointments (
  id uuid primary key default gen_random_uuid(),
  "scheduleId" uuid not null references scheduling.schedules(id) on delete cascade,
  title text not null,
  start timestamptz not null,
  "end" timestamptz not null,
  status text not null default 'scheduled',
  notes text,
  color text,
  "recurrenceRule" jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint appointments_time_range_ck check ("end" > start)
);

create index if not exists scheduling_appointments_schedule_start_idx
  on scheduling.appointments ("scheduleId", start);

create index if not exists scheduling_availability_blocks_schedule_dow_idx
  on scheduling.availability_blocks ("scheduleId", "dayOfWeek");

create index if not exists scheduling_schedules_tenant_idx
  on scheduling.schedules ("tenantId");

create or replace function scheduling.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists scheduling_appointments_set_updated_at on scheduling.appointments;
create trigger scheduling_appointments_set_updated_at
before update on scheduling.appointments
for each row execute function scheduling.set_updated_at();

alter table scheduling.schedules enable row level security;
alter table scheduling.availability_blocks enable row level security;
alter table scheduling.appointments enable row level security;

do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['schedules', 'availability_blocks', 'appointments'])
  loop
    execute format('drop policy if exists "scheduling_%s_tenant_header_all" on scheduling.%I', tbl, tbl);
    if tbl = 'schedules' then
      execute format(
        $p$create policy "scheduling_%s_tenant_header_all" on scheduling.%I
          for all
          using ("tenantId" = (current_setting('request.headers', true)::json ->> 'x-tenant-id'))
          with check ("tenantId" = (current_setting('request.headers', true)::json ->> 'x-tenant-id'))$p$,
        tbl, tbl
      );
    else
      execute format(
        $p$create policy "scheduling_%s_tenant_header_all" on scheduling.%I
          for all
          using (exists (
            select 1
            from scheduling.schedules s
            where s.id = %I."scheduleId"
              and s."tenantId" = (current_setting('request.headers', true)::json ->> 'x-tenant-id')
          ))
          with check (exists (
            select 1
            from scheduling.schedules s
            where s.id = %I."scheduleId"
              and s."tenantId" = (current_setting('request.headers', true)::json ->> 'x-tenant-id')
          ))$p$,
        tbl, tbl, tbl, tbl
      );
    end if;
  end loop;
end $$;

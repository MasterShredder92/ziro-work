-- Speed up schedule week loads: filter by tenant + location + date range, and related joins.
-- Indexes are maintained automatically on INSERT/UPDATE/DELETE (unlike materialized views).

create index if not exists idx_schedule_blocks_tenant_location_date
  on public.schedule_blocks (tenant_id, location_id, block_date);

create index if not exists idx_teacher_availability_tenant_location
  on public.teacher_availability (tenant_id, location_id);

create index if not exists idx_teacher_locations_location_id
  on public.teacher_locations (location_id);

-- Partial index: matches loadWindowedScheduleData students query (active at location only).
create index if not exists idx_students_tenant_location_active
  on public.students (tenant_id, location_id)
  where deactivated_at is null;

create index if not exists idx_location_hours_location_id
  on public.location_hours (location_id);

create index if not exists idx_rooms_tenant_location_active
  on public.rooms (tenant_id, location_id)
  where is_active = true;

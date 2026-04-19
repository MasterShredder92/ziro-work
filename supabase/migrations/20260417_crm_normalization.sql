-- CRM normalization for ZiroWork OS
-- Target project: dhsyxyhtoadrqfrlmsqe
-- Normalizes contact data into students (email/phone) and a dedicated addresses table.

-- ─────────────────────────────────────────────────────────────────────────────
-- A. Normalized addresses table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  entity_type text not null check (entity_type in ('family','student')),
  entity_id uuid not null,
  line1 text,
  line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists addresses_tenant_id_idx on public.addresses (tenant_id);
create index if not exists addresses_entity_idx on public.addresses (entity_type, entity_id);

drop trigger if exists set_updated_at on public.addresses;
create trigger set_updated_at before update on public.addresses
for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- B. Students: add email/phone, convert status enum to text
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.students
  add column if not exists email text,
  add column if not exists phone text;

alter table public.students
  alter column status type text using status::text;

-- ─────────────────────────────────────────────────────────────────────────────
-- C. Backfill student email/phone from family primary contact
-- ─────────────────────────────────────────────────────────────────────────────
update public.students s
set
  email = coalesce(s.email, p.email),
  phone = coalesce(s.phone, p.phone)
from public.families f
join public.profiles p on p.id = f.primary_contact_id
where s.family_id = f.id;

-- ─────────────────────────────────────────────────────────────────────────────
-- D. Backfill addresses from families
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.addresses (tenant_id, entity_type, entity_id, line1, line2, city, state, postal_code, country)
select
  f.tenant_id,
  'family',
  f.id,
  f.address_line1,
  f.address_line2,
  f.city,
  f.state,
  f.postal_code,
  f.country
from public.families f
where f.address_line1 is not null;

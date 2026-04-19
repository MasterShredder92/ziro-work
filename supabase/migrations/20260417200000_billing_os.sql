-- Billing & Invoicing OS
-- Extends invoices, adds billing_plans, subscriptions, invoice_line_items,
-- payments, credits, discounts, and supporting settings rows.

-- ---------------------------------------------------------------------------
-- Invoices: extend the existing table with full billing columns.
-- ---------------------------------------------------------------------------
alter table public.invoices
  add column if not exists number text,
  add column if not exists subscription_id uuid,
  add column if not exists billing_plan_id uuid,
  add column if not exists subtotal_cents int not null default 0,
  add column if not exists tax_cents int not null default 0,
  add column if not exists discount_cents int not null default 0,
  add column if not exists total_cents int not null default 0,
  add column if not exists amount_paid_cents int not null default 0,
  add column if not exists balance_cents int not null default 0,
  add column if not exists issued_at timestamptz,
  add column if not exists notes text,
  add column if not exists terms text,
  add column if not exists voided_at timestamptz,
  add column if not exists void_reason text,
  add column if not exists sent_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists invoices_tenant_number_uq
  on public.invoices (tenant_id, number) where number is not null;
create index if not exists invoices_subscription_id_idx on public.invoices (subscription_id);
create index if not exists invoices_due_date_idx on public.invoices (due_at);

-- ---------------------------------------------------------------------------
-- Invoice line items
-- ---------------------------------------------------------------------------
create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  invoice_id uuid not null references public.invoices(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  session_log_id uuid,
  schedule_block_id uuid,

  kind text not null default 'line', -- 'line' | 'session' | 'fee' | 'tax' | 'discount'
  description text not null,
  quantity numeric not null default 1,
  unit_amount_cents int not null default 0,
  amount_cents int not null default 0,
  taxable boolean not null default false,
  sort_order int not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists invoice_line_items_tenant_idx on public.invoice_line_items (tenant_id);
create index if not exists invoice_line_items_invoice_idx on public.invoice_line_items (invoice_id);
create index if not exists invoice_line_items_student_idx on public.invoice_line_items (student_id);
create index if not exists invoice_line_items_session_idx on public.invoice_line_items (session_log_id);

-- ---------------------------------------------------------------------------
-- Payments (first-party, distinct from square_payments_fact)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  invoice_id uuid references public.invoices(id) on delete set null,
  family_id uuid references public.families(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,

  amount_cents int not null default 0,
  currency text not null default 'USD',
  method text not null default 'manual', -- manual | card | ach | cash | check | square | stripe
  reference text,
  paid_at timestamptz not null default now(),
  status text not null default 'succeeded', -- pending | succeeded | refunded | failed
  refunded_cents int not null default 0,
  refunded_at timestamptz,
  refund_reason text,
  recorded_by uuid,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists payments_tenant_idx on public.payments (tenant_id);
create index if not exists payments_invoice_idx on public.payments (invoice_id);
create index if not exists payments_family_idx on public.payments (family_id);
create index if not exists payments_student_idx on public.payments (student_id);
create index if not exists payments_paid_at_idx on public.payments (paid_at);
create index if not exists payments_status_idx on public.payments (status);

-- ---------------------------------------------------------------------------
-- Credits (family account credits applied toward invoices)
-- ---------------------------------------------------------------------------
create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  family_id uuid references public.families(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,

  amount_cents int not null default 0,
  applied_cents int not null default 0,
  reason text,
  expires_at timestamptz,
  status text not null default 'active', -- active | applied | expired | voided
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists credits_tenant_idx on public.credits (tenant_id);
create index if not exists credits_family_idx on public.credits (family_id);
create index if not exists credits_student_idx on public.credits (student_id);
create index if not exists credits_invoice_idx on public.credits (invoice_id);
create index if not exists credits_status_idx on public.credits (status);

-- ---------------------------------------------------------------------------
-- Discounts (tenant-wide promos / rules)
-- ---------------------------------------------------------------------------
create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  code text,
  name text not null,
  kind text not null default 'percent', -- percent | fixed
  percent_bp int, -- basis points (e.g. 1000 = 10%)
  amount_cents int,
  applies_to text not null default 'invoice', -- invoice | line | subscription
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists discounts_tenant_code_uq
  on public.discounts (tenant_id, code) where code is not null;
create index if not exists discounts_tenant_idx on public.discounts (tenant_id);
create index if not exists discounts_active_idx on public.discounts (active);

-- ---------------------------------------------------------------------------
-- Billing plans (fixed / hourly / per-lesson / hybrid)
-- ---------------------------------------------------------------------------
create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  kind text not null default 'fixed', -- fixed | hourly | per_lesson | hybrid
  interval text not null default 'month', -- week | month | quarter | year
  interval_count int not null default 1,
  base_price_cents int not null default 0,
  per_unit_price_cents int,
  included_units int,
  unit_label text,
  tax_rate_bp int not null default 0,
  currency text not null default 'USD',
  description text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists billing_plans_tenant_idx on public.billing_plans (tenant_id);
create index if not exists billing_plans_active_idx on public.billing_plans (active);

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  billing_plan_id uuid references public.billing_plans(id) on delete set null,
  family_id uuid references public.families(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,

  status text not null default 'active', -- active | paused | cancelled | past_due
  start_date date not null default current_date,
  end_date date,
  current_period_start date,
  current_period_end date,
  next_invoice_at timestamptz,
  cancel_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  price_override_cents int,
  quantity numeric not null default 1,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists subscriptions_tenant_idx on public.subscriptions (tenant_id);
create index if not exists subscriptions_family_idx on public.subscriptions (family_id);
create index if not exists subscriptions_student_idx on public.subscriptions (student_id);
create index if not exists subscriptions_plan_idx on public.subscriptions (billing_plan_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_next_invoice_idx on public.subscriptions (next_invoice_at);

-- ---------------------------------------------------------------------------
-- Billing settings (singleton row per tenant)
-- ---------------------------------------------------------------------------
create table if not exists public.billing_settings (
  tenant_id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  invoice_prefix text not null default 'INV-',
  invoice_next_number int not null default 1001,
  invoice_pad_width int not null default 4,
  default_terms text,
  default_net_days int not null default 15,
  default_tax_rate_bp int not null default 0,
  default_currency text not null default 'USD',
  payment_methods jsonb not null default '["card","ach","cash","check","manual"]'::jsonb,
  late_fee_cents int not null default 0,
  late_fee_grace_days int not null default 3,
  metadata jsonb not null default '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- RLS (header-based tenant scoping, consistent with existing tables)
-- ---------------------------------------------------------------------------
alter table public.invoice_line_items enable row level security;
alter table public.payments enable row level security;
alter table public.credits enable row level security;
alter table public.discounts enable row level security;
alter table public.billing_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_settings enable row level security;

do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'invoice_line_items',
      'payments',
      'credits',
      'discounts',
      'billing_plans',
      'subscriptions',
      'billing_settings'
    ])
  loop
    execute format(
      'drop policy if exists "%s_tenant_header_all" on public.%I',
      tbl, tbl
    );
    execute format(
      $p$create policy "%s_tenant_header_all" on public.%I
        for all
        using (tenant_id = (current_setting('request.headers', true)::json ->> 'x-tenant-id'))
        with check (tenant_id = (current_setting('request.headers', true)::json ->> 'x-tenant-id'))$p$,
      tbl, tbl
    );
  end loop;
end $$;

-- Billing OS foundation (plans, subscriptions compatibility, usage metering, invoices compatibility)

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  name text not null,
  price_monthly bigint not null default 0,
  price_yearly bigint not null default 0,
  limits jsonb not null default '{}'::jsonb,
  billing_plan_id uuid references public.billing_plans(id) on delete set null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_tenant_fk
    foreign key (tenant_id) references public.tenants(id) on delete cascade
);

create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  metric text not null,
  amount numeric not null default 0,
  timestamp timestamptz not null default now(),
  source text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint usage_records_tenant_fk
    foreign key (tenant_id) references public.tenants(id) on delete cascade
);

create index if not exists plans_tenant_idx
  on public.plans (tenant_id);
create unique index if not exists plans_tenant_name_uq
  on public.plans (tenant_id, name);
create index if not exists plans_active_idx
  on public.plans (is_active);
create index if not exists usage_records_tenant_metric_ts_idx
  on public.usage_records (tenant_id, metric, timestamp desc);
create index if not exists usage_records_tenant_ts_idx
  on public.usage_records (tenant_id, timestamp desc);

alter table public.subscriptions
  add column if not exists plan_id uuid references public.plans(id) on delete set null,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

alter table public.invoices
  add column if not exists amount bigint,
  add column if not exists period_start timestamptz,
  add column if not exists period_end timestamptz,
  add column if not exists line_items jsonb not null default '[]'::jsonb,
  add column if not exists stripe_invoice_id text;

update public.invoices
set amount = coalesce(amount, total_cents, amount_cents, 0)
where amount is null;

create index if not exists subscriptions_plan_id_idx
  on public.subscriptions (plan_id);
create index if not exists subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id);
create index if not exists invoices_period_idx
  on public.invoices (tenant_id, period_start, period_end);
create index if not exists invoices_stripe_invoice_id_idx
  on public.invoices (stripe_invoice_id);

alter table public.plans enable row level security;
alter table public.usage_records enable row level security;

do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['plans','usage_records'])
  loop
    execute format('drop policy if exists "%s_tenant_header_all" on public.%I', tbl, tbl);
    execute format(
      $p$create policy "%s_tenant_header_all" on public.%I
        for all
        using (tenant_id = (current_setting('request.headers', true)::json ->> 'x-tenant-id'))
        with check (tenant_id = (current_setting('request.headers', true)::json ->> 'x-tenant-id'))$p$,
      tbl, tbl
    );
  end loop;
end $$;

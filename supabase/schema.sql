-- ZiroWork Live Schema
-- Generated: 2026-05-19
-- Source: Supabase project gngbyydqjouxkoprzzil (137 tables)
-- WARNING: This is the authoritative schema. DO NOT edit manually.
--          Regenerate via: supabase db dump or equivalent MCP query.

CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  user_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  location_id uuid,
  CONSTRAINT activity_log_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  line1 text,
  line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.agent_tenants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  supabase_url text NOT NULL,
  supabase_service_key text NOT NULL,
  plan_tier text NOT NULL DEFAULT 'individual'::text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  intake_api_key text,
  integrations_enabled jsonb NOT NULL DEFAULT '{"square": false, "openphone": false, "website_form": false}'::jsonb,
  CONSTRAINT agent_tenants_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.agreements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  studentid uuid,
  url text,
  signed boolean NOT NULL DEFAULT false,
  signed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT agreements_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.anchor_job_locks (
  job_id text NOT NULL,
  acquired_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  CONSTRAINT anchor_job_locks_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.api_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  name text NOT NULL,
  token_hash text NOT NULL,
  token_prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT api_tokens_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.appointment_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  block_id uuid NOT NULL,
  event_type text NOT NULL,
  channel text NOT NULL,
  recipient_type text NOT NULL,
  recipient_name text,
  recipient_contact text,
  message_content text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointment_notifications_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  student_id uuid NOT NULL,
  lesson_date timestamp with time zone NOT NULL,
  present boolean NOT NULL,
  CONSTRAINT attendance_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  performed_by uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  user_name text,
  user_role text,
  location_id uuid,
  entity_name text,
  CONSTRAINT audit_log_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bank_name text NOT NULL,
  account_number_masked text NOT NULL,
  routing_number text,
  ingestion_method text,
  last_synced_at timestamp with time zone,
  CONSTRAINT bank_accounts_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.bank_statements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bank_account_id uuid,
  file_type text,
  file_path text NOT NULL,
  statement_month integer,
  statement_year integer,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bank_statements_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bank_account_id uuid,
  date date NOT NULL,
  amount numeric NOT NULL,
  description text NOT NULL,
  category text,
  balance_after numeric,
  source_statement_id uuid,
  fitid text,
  hash text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bank_transactions_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.billing_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  family_id uuid NOT NULL,
  student_id uuid NOT NULL,
  adjustment_type text NOT NULL,
  amount_cents integer,
  percent numeric(5,2),
  reason text NOT NULL,
  notes text,
  applies_to_cycle date NOT NULL,
  applied boolean NOT NULL DEFAULT false,
  applied_at timestamp with time zone,
  applied_to_billing_event_id uuid,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  billing_cycle_id uuid,
  status text DEFAULT 'pending'::text,
  CONSTRAINT billing_adjustments_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.billing_cycles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  billing_month date NOT NULL,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'open'::text,
  auto_generated_at timestamp with time zone,
  locked_at timestamp with time zone,
  sent_at timestamp with time zone,
  total_base_cents integer,
  total_adjusted_cents integer,
  total_paid_cents integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT billing_cycles_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  family_id uuid NOT NULL,
  billing_period_id uuid,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  square_payment_id text,
  failure_reason text,
  idempotency_key text,
  attempted_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  student_id uuid,
  description text,
  due_date date,
  notes text,
  CONSTRAINT billing_events_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.billing_line_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  billing_event_id uuid NOT NULL,
  student_id uuid NOT NULL,
  sessions_count integer NOT NULL,
  rate_per_session_cents integer NOT NULL,
  subtotal_cents integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT billing_line_items_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.billing_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  period_label text NOT NULL,
  billing_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  total_attempted integer DEFAULT 0,
  total_succeeded integer DEFAULT 0,
  total_failed integer DEFAULT 0,
  total_revenue_cents integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT billing_periods_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.billing_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  description text,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD'::text,
  interval text NOT NULL DEFAULT 'month'::text,
  interval_count integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT billing_plans_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.billing_settings (
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  invoice_prefix text NOT NULL DEFAULT 'INV'::text,
  invoice_next_number integer NOT NULL DEFAULT 1,
  invoice_pad_width integer NOT NULL DEFAULT 4,
  default_terms text,
  default_net_days integer NOT NULL DEFAULT 30,
  default_tax_rate_bp integer NOT NULL DEFAULT 0,
  default_currency text NOT NULL DEFAULT 'USD'::text,
  payment_methods text[] NOT NULL DEFAULT '{}'::text[],
  late_fee_cents integer NOT NULL DEFAULT 0,
  late_fee_grace_days integer NOT NULL DEFAULT 0,
  metadata jsonb,
  CONSTRAINT billing_settings_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.brand_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  location_id uuid,
  logo_circle_path text,
  logo_wide_path text,
  logo_favicon_path text,
  primary_color text,
  secondary_color text,
  background_color text,
  studio_name text,
  tagline text,
  website_domain text,
  phone text,
  email text,
  address_line1 text,
  address_city text,
  address_state text,
  address_zip text,
  google_maps_url text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  youtube_url text,
  ga4_id text,
  meta_pixel_id text,
  tiktok_pixel_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brand_settings_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_name text,
  owner_name text,
  email text,
  phone text,
  city text,
  state text,
  country text DEFAULT 'US'::text,
  vertical text,
  source text,
  email_score integer DEFAULT 0,
  tags text[] DEFAULT '{}'::text[],
  sequence_step integer DEFAULT 0,
  last_touched timestamp with time zone,
  status text DEFAULT 'cold'::text,
  landing_url text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contacts_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.credits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  family_id uuid,
  student_id uuid,
  invoice_id uuid,
  amount_cents integer NOT NULL DEFAULT 0,
  reason text,
  applied_at timestamp with time zone,
  expires_at timestamp with time zone,
  status text NOT NULL DEFAULT 'available'::text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT credits_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  business_name text,
  owner_name text,
  vertical text,
  plan text NOT NULL,
  status text DEFAULT 'trial'::text,
  stripe_customer_id text,
  mrr numeric DEFAULT 0,
  contact_id uuid,
  trial_started_at timestamp with time zone DEFAULT now(),
  converted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.discounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  code text,
  type text NOT NULL DEFAULT 'percent'::text,
  value numeric NOT NULL DEFAULT 0,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT discounts_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active'::text,
  archived_at timestamp with time zone,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT enrollments_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.error_resolution_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  error_code text,
  message text NOT NULL,
  stack_trace text,
  input_payload jsonb,
  route text,
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  notes text,
  CONSTRAINT error_resolution_logs_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  actor_type text,
  actor_id uuid,
  event_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT events_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  location_id uuid,
  category text NOT NULL,
  description text,
  amount_cents integer NOT NULL,
  is_recurring boolean DEFAULT true,
  frequency text DEFAULT 'monthly'::text,
  effective_date date,
  end_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.families (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  primary_contact_id uuid,
  primary_email text,
  primary_phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  primary_contact_name text,
  billing_notes text,
  is_military boolean NOT NULL DEFAULT false,
  profile_id uuid,
  card_last_four text,
  card_brand text,
  square_customer_id text,
  square_card_id text,
  card_exp_month integer,
  card_exp_year integer,
  billing_day integer DEFAULT 1,
  billing_status text NOT NULL DEFAULT 'active'::text,
  balance integer NOT NULL DEFAULT 0,
  parent_name text,
  rate_tier integer NOT NULL DEFAULT 4500,
  rate_tier_override boolean NOT NULL DEFAULT false,
  rate_tier_override_by uuid,
  rate_tier_override_at timestamp with time zone,
  rate_tier_reason text,
  primary_location_id uuid NOT NULL,
  parent_first_name text,
  parent_last_name text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  scheduling_notes text,
  lifetime_paid_cents integer NOT NULL DEFAULT 0,
  overdue_balance_cents integer NOT NULL DEFAULT 0,
  stripe_customer_id_connect text,
  autopay_enabled boolean DEFAULT false,
  default_payment_method_id text,
  notify_via_sms boolean NOT NULL DEFAULT true,
  notify_via_email boolean NOT NULL DEFAULT true,
  reminder_4hr boolean NOT NULL DEFAULT true,
  reminder_1hr boolean NOT NULL DEFAULT false,
  sms_opted_out boolean DEFAULT false,
  referral_code text,
  referred_by_family_id uuid,
  referral_count integer DEFAULT 0,
  archived_at timestamp with time zone,
  status text DEFAULT 'active'::text,
  notes text,
  discount_tier character varying(50) DEFAULT 'Standard'::character varying,
  CONSTRAINT families_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.family_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  family_id uuid NOT NULL,
  file_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size_bytes integer,
  uploaded_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  signwell_document_id text,
  signwell_status text DEFAULT 'completed'::text,
  source text DEFAULT 'manual'::text,
  CONSTRAINT family_files_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.files (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  description text,
  is_visible_to_parent boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT files_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.finance_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plaid_item_id uuid NOT NULL,
  plaid_account_id text NOT NULL,
  location_id uuid,
  account_name text NOT NULL,
  official_name text,
  mask text,
  account_type text,
  account_subtype text,
  institution_name text,
  is_active boolean NOT NULL DEFAULT true,
  is_liquidity_account boolean NOT NULL DEFAULT true,
  include_in_financials boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id text NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  CONSTRAINT finance_accounts_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.finance_balance_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  snapshot_at timestamp with time zone NOT NULL DEFAULT now(),
  available_balance numeric(14,2),
  current_balance numeric(14,2),
  iso_currency_code text DEFAULT 'USD'::text,
  source text NOT NULL DEFAULT 'plaid'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  CONSTRAINT finance_balance_snapshots_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.finance_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  CONSTRAINT finance_categories_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.finance_category_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  name text NOT NULL,
  direction text,
  display_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  CONSTRAINT finance_category_groups_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.finance_category_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  location_id uuid,
  account_id uuid,
  rule_type text NOT NULL,
  match_value text,
  match_value_2 text,
  priority integer NOT NULL DEFAULT 100,
  applies_to_direction text DEFAULT 'any'::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  CONSTRAINT finance_category_rules_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.finance_exports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requested_by text,
  location_id uuid,
  from_month date,
  to_month date,
  export_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  file_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  CONSTRAINT finance_exports_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.finance_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  location_type text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id text NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  core_location_id uuid,
  CONSTRAINT finance_locations_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.finance_plaid_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plaid_item_id text NOT NULL,
  institution_id text,
  institution_name text,
  status text NOT NULL DEFAULT 'active'::text,
  transactions_cursor text,
  last_transactions_sync_at timestamp with time zone,
  last_balances_sync_at timestamp with time zone,
  last_webhook_at timestamp with time zone,
  error_code text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  access_token text,
  CONSTRAINT finance_plaid_items_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.finance_recurring_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  location_id uuid,
  account_id uuid,
  category_id uuid,
  name text NOT NULL,
  merchant_match text,
  transaction_name_match text,
  amount_hint numeric(14,2),
  cadence text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  CONSTRAINT finance_recurring_rules_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.finance_sync_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plaid_item_id uuid,
  sync_type text NOT NULL,
  status text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  added_count integer NOT NULL DEFAULT 0,
  modified_count integer NOT NULL DEFAULT 0,
  removed_count integer NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  CONSTRAINT finance_sync_runs_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.finance_transaction_category_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  category_id uuid,
  assignment_source text NOT NULL,
  assigned_by text,
  confidence numeric(5,2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  CONSTRAINT finance_transaction_category_assignments_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  location_id uuid,
  plaid_transaction_id text,
  pending_plaid_transaction_id text,
  external_reference text,
  posted_date date,
  authorized_date date,
  month_bucket date,
  transaction_name text NOT NULL,
  merchant_name text,
  amount numeric(14,2) NOT NULL,
  iso_currency_code text DEFAULT 'USD'::text,
  unofficial_currency_code text,
  plaid_primary_category text,
  plaid_detailed_category text,
  payment_channel text,
  is_pending boolean NOT NULL DEFAULT false,
  is_recurring boolean NOT NULL DEFAULT false,
  is_transfer boolean NOT NULL DEFAULT false,
  is_excluded boolean NOT NULL DEFAULT false,
  notes text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  CONSTRAINT finance_transactions_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.google_oauth_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  connected_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT google_oauth_tokens_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.intake_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  location_id uuid,
  source text NOT NULL DEFAULT 'website_form'::text,
  form_version text NOT NULL DEFAULT '1'::text,
  raw_payload jsonb NOT NULL,
  lead_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  converted_student_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_at timestamp with time zone,
  status text DEFAULT 'new'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT intake_submissions_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.integration_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  integration_id text NOT NULL,
  status text NOT NULL DEFAULT 'connected'::text,
  enabled boolean NOT NULL DEFAULT true,
  credentials jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  connected_at timestamp with time zone DEFAULT now(),
  connected_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_health_check timestamp with time zone,
  health_status text DEFAULT 'unknown'::text,
  health_message text,
  last_activity_at timestamp with time zone,
  webhook_url text,
  credentials_encrypted text,
  CONSTRAINT integration_configs_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.integration_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  source text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  matched boolean DEFAULT false,
  matched_entity text,
  matched_entity_id uuid,
  error text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT integration_events_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.invoice_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_token_id uuid NOT NULL,
  family_id uuid NOT NULL,
  reason text NOT NULL,
  flagged_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'open'::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  resolution_notes text,
  CONSTRAINT invoice_flags_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  student_id uuid,
  description text NOT NULL DEFAULT ''::text,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  amount numeric(10,2) DEFAULT (quantity * unit_price),
  is_makeup_session boolean NOT NULL DEFAULT false,
  is_fifth_week boolean NOT NULL DEFAULT false,
  session_date date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT invoice_items_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  invoice_id uuid NOT NULL,
  student_id uuid,
  session_log_id uuid,
  schedule_block_id uuid,
  kind text NOT NULL DEFAULT 'line'::text,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_amount_cents integer NOT NULL DEFAULT 0,
  amount_cents integer NOT NULL DEFAULT 0,
  taxable boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT invoice_line_items_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.invoice_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  family_id uuid NOT NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'::text),
  billing_period_label text,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '30 days'::interval),
  viewed_at timestamp with time zone,
  paid_at timestamp with time zone,
  square_payment_id text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  location_id uuid,
  due_date date,
  billing_day integer,
  invoice_snapshot jsonb,
  sent_via text,
  sent_at timestamp with time zone,
  reminder_count integer DEFAULT 0,
  last_reminder_at timestamp with time zone,
  billing_cycle_id uuid,
  base_amount_cents integer,
  adjustment_total_cents integer DEFAULT 0,
  is_prorated boolean DEFAULT false,
  CONSTRAINT invoice_tokens_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  family_id uuid,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD'::text,
  status text NOT NULL DEFAULT 'draft'::text,
  due_at timestamp with time zone,
  due_date date,
  number text,
  student_id uuid,
  subscription_id uuid,
  billing_plan_id uuid,
  subtotal_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  amount_paid_cents integer NOT NULL DEFAULT 0,
  balance_cents integer NOT NULL DEFAULT 0,
  issued_at timestamp with time zone,
  paid_at timestamp with time zone,
  sent_at timestamp with time zone,
  voided_at timestamp with time zone,
  void_reason text,
  description text,
  notes text,
  terms text,
  external_ref text,
  archived_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  theme_preference character varying(20) DEFAULT 'dark'::character varying,
  live_url_token character varying(255),
  location_id uuid NOT NULL,
  google_review_enabled boolean DEFAULT false,
  show_practice_timer boolean DEFAULT false,
  is_recurring boolean DEFAULT false,
  recurring_day integer DEFAULT 1,
  next_invoice_date date,
  parent_invoice_id uuid,
  invoice_month character varying(7),
  pdf_url text,
  pdf_generated_at timestamp with time zone,
  square_invoice_id text,
  square_order_id text,
  square_public_url text,
  square_pushed_at timestamp with time zone,
  square_push_error text,
  CONSTRAINT invoices_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.issues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  reported_by_role text NOT NULL,
  page text NOT NULL,
  section text NOT NULL,
  element_description text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  screenshot_path text,
  category text NOT NULL DEFAULT 'bug'::text,
  severity text NOT NULL DEFAULT 'normal'::text,
  status text NOT NULL DEFAULT 'reported'::text,
  resolution_notes text,
  resolved_at timestamp with time zone,
  resolved_by text,
  related_issue_id uuid,
  pipeline_prompt text,
  pipeline_started_at timestamp with time zone,
  pipeline_completed_at timestamp with time zone,
  deploy_status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  platform text DEFAULT 'both'::text,
  reported_from_url text,
  reported_screen_width integer,
  reported_screen_height integer,
  subsection text,
  steps_to_reproduce text,
  user_friendly_category character varying(100),
  CONSTRAINT issues_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  student_id uuid,
  name text,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'new'::text,
  source text,
  stage text,
  last_contacted_at timestamp with time zone,
  inactivity_bucket text,
  location_id uuid,
  first_name text,
  last_name text,
  parent_name text,
  instrument text,
  age text,
  goals text,
  preferred_days text[],
  preferred_times text,
  how_heard text,
  is_military boolean NOT NULL DEFAULT false,
  assigned_teacher_id uuid,
  matched_block_id uuid,
  converted_student_id uuid,
  follow_up_count integer NOT NULL DEFAULT 0,
  last_contact_at timestamp with time zone,
  next_follow_up_at timestamp with time zone,
  notes text,
  tags text[],
  ai_context jsonb DEFAULT '{}'::jsonb,
  next_action text,
  assigned_to uuid,
  age_range text,
  experience text,
  has_instrument text,
  preferred_locations text[],
  personality_notes text,
  student_name text,
  compatibility_score integer,
  source_page text,
  matched_teacher_id uuid,
  secondary_location_ids uuid[],
  family_id uuid,
  lost_reason text,
  lost_category text,
  submission_id uuid,
  referral_code_used text,
  referred_by_family_id uuid,
  intake_submission_id uuid,
  CONSTRAINT leads_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lessonid uuid,
  agentid uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lesson_notes_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id text NOT NULL,
  student_id uuid,
  teacher_id uuid,
  content text NOT NULL,
  event_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lesson_plans_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  studentid uuid,
  teacherid uuid,
  schedule_block_id uuid,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lessons_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.lifecycle (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  stage text NOT NULL,
  previous_stage text,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lifecycle_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.location_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  open_time time without time zone NOT NULL,
  close_time time without time zone NOT NULL,
  is_closed boolean DEFAULT false,
  CONSTRAINT location_hours_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.locations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL DEFAULT 'NE'::text,
  zip text NOT NULL,
  phone text,
  email text,
  website text,
  google_review_url text,
  hours_json jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  logo_url text,
  color text DEFAULT '#D4226A'::text,
  state_rank integer,
  students_enrolled integer,
  students_taught_total integer,
  floorplan_cols integer DEFAULT 16,
  floorplan_rows integer DEFAULT 8,
  min_floors integer DEFAULT 1,
  square_location_id text,
  CONSTRAINT locations_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.metric_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source text NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT metric_snapshots_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  author_id uuid,
  body text NOT NULL,
  CONSTRAINT notes_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  route text,
  reference_id uuid,
  reference_type text,
  read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.onboarding_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  family_id uuid,
  location_id uuid,
  enrollment_date date NOT NULL,
  day_7_due date,
  day_7_completed_at timestamp with time zone,
  day_7_type text,
  day_14_due date,
  day_14_completed_at timestamp with time zone,
  day_14_type text,
  day_30_due date,
  day_30_completed_at timestamp with time zone,
  day_30_type text,
  day_60_due date,
  day_60_completed_at timestamp with time zone,
  day_60_type text,
  day_90_due date,
  day_90_completed_at timestamp with time zone,
  day_90_type text,
  status text NOT NULL DEFAULT 'active'::text,
  risk_flag boolean DEFAULT false,
  risk_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT onboarding_sequences_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.operator_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  active_location_id uuid,
  active_date date DEFAULT CURRENT_DATE,
  active_view text DEFAULT 'schedule'::text,
  active_modal text DEFAULT 'none'::text,
  focused_block_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT operator_sessions_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  invoice_id uuid,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD'::text,
  method text,
  status text NOT NULL DEFAULT 'pending'::text,
  paid_at timestamp with time zone,
  family_id uuid,
  student_id uuid,
  refunded_cents integer NOT NULL DEFAULT 0,
  notes text,
  reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT payments_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.pending_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL,
  reminder_type text NOT NULL,
  fire_at timestamp with time zone NOT NULL,
  fired boolean NOT NULL DEFAULT false,
  cancelled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pending_reminders_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.performance_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  alert_type text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  dedupe_key text NOT NULL,
  first_seen_at timestamp with time zone NOT NULL,
  last_seen_at timestamp with time zone NOT NULL,
  occurrence_count integer NOT NULL DEFAULT 1,
  worst_metric numeric,
  latest_metric numeric,
  resolution_reason text,
  regressed_at timestamp with time zone,
  muted_until timestamp with time zone,
  archived_at timestamp with time zone,
  status text DEFAULT 'open'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT performance_alerts_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  session_id text NOT NULL,
  page_route text NOT NULL,
  load_time_ms integer,
  fcp_ms integer,
  lcp_ms integer,
  cls_score numeric(6,4),
  inp_ms integer,
  ttfb_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT performance_metrics_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.permission_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  category text NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  description text,
  owner_default boolean DEFAULT true,
  company_director_default boolean DEFAULT true,
  studio_director_default boolean DEFAULT false,
  teacher_default boolean DEFAULT false,
  parent_default boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permission_definitions_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.portal_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  author_id uuid,
  content text,
  file_attachments jsonb,
  visibility character varying(20) DEFAULT 'internal'::character varying,
  is_locked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT portal_activity_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.portalsessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  userid uuid,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  CONSTRAINT portalsessions_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text,
  min_active_students integer NOT NULL,
  max_active_students integer NOT NULL,
  rate_per_session_cents integer NOT NULL,
  sessions_per_month_default integer NOT NULL DEFAULT 4,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tier_name text,
  display_name text,
  price_cents integer,
  currency text DEFAULT 'USD'::text,
  billing_cadence text DEFAULT 'monthly'::text,
  square_plan_variation_id text,
  square_location_id text DEFAULT 'L1KDA36BBCW13'::text,
  max_locations integer,
  max_teachers integer,
  CONSTRAINT pricing_tiers_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.privacy_violation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  teacher_id uuid,
  student_id uuid,
  requested_field text NOT NULL,
  query_text text,
  blocked boolean DEFAULT true,
  detected_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT privacy_violation_log_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.profile_locations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  location_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_locations_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  role user_role NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  export_pin text,
  is_platform_admin boolean DEFAULT false,
  onboarding_completed_at timestamp with time zone,
  onboarding_skipped boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_id text NOT NULL,
  tenant_id uuid,
  ip text,
  route text,
  key text NOT NULL,
  max_allowed integer NOT NULL,
  window_ms integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rate_limit_hits_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.raven_escalations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id text NOT NULL,
  conversation_id text,
  contact_phone text,
  contact_email text,
  contact_name text,
  trigger_reason text NOT NULL,
  original_message text,
  raven_response text,
  agent_context jsonb,
  status text NOT NULL DEFAULT 'pending'::text,
  resolved_by text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT raven_escalations_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.raven_knowledge_base (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  framework_id text NOT NULL,
  category text NOT NULL,
  trigger_conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  template text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  banned_phrases jsonb NOT NULL DEFAULT '[]'::jsonb,
  required_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  branch_logic jsonb,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  channel text NOT NULL DEFAULT 'sms'::text,
  CONSTRAINT raven_knowledge_base_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.raven_message_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id text NOT NULL,
  event_id text,
  from_agent text NOT NULL,
  channel text NOT NULL,
  direction text NOT NULL DEFAULT 'outbound'::text,
  recipient_phone text,
  recipient_email text,
  recipient_name text,
  location_id text,
  framework_used text,
  message_body text NOT NULL,
  subject text,
  status text NOT NULL DEFAULT 'pending'::text,
  sent_at timestamp with time zone,
  error_message text,
  sms_enabled boolean NOT NULL DEFAULT false,
  requires_approval boolean NOT NULL DEFAULT true,
  approved_by text,
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  retry_count integer NOT NULL DEFAULT 0,
  CONSTRAINT raven_message_log_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.recruitment_prospects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  instruments text[],
  status text DEFAULT 'new'::text,
  source text,
  source_detail text,
  notes text,
  resume_url text,
  location_id uuid,
  bio text,
  personality text,
  primary_instruments text,
  secondary_instruments text,
  lesson_style text,
  teaching_strengths text,
  musical_strengths_background text,
  style_genre_strengths text,
  skill_levels_by_instrument text,
  preferred_age_range text,
  acceptable_age_range text,
  best_first_lesson_fit text,
  best_match_students text,
  use_caution_internal_placement_notes text,
  meet_and_greet_fit text,
  substitute_coverage text,
  customer_facing_match_summary text,
  internal_matching_tags text,
  internal_match_notes text,
  director_notes text,
  interview_date date,
  audition_notes text,
  pay_rate_requested numeric(8,2),
  availability_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recruitment_prospects_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.recurring_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  location_id uuid NOT NULL,
  day_of_week smallint NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  instrument text,
  is_active boolean NOT NULL DEFAULT true,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_until date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  room_id uuid,
  CONSTRAINT recurring_lessons_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.review_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  studentid uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT review_requests_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reviewer_name text NOT NULL,
  location_name text NOT NULL,
  text_cleaned text NOT NULL,
  instrument_tag text NOT NULL DEFAULT 'general'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  tenant_id uuid,
  family_id uuid,
  student_id uuid,
  location_id uuid,
  rating integer,
  body text,
  parent_name text,
  student_name text,
  approved boolean DEFAULT false,
  featured boolean DEFAULT false,
  shareable boolean DEFAULT true,
  prompted_by text,
  review_token text,
  CONSTRAINT reviews_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.room_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid,
  tenant_id uuid,
  item_name text NOT NULL,
  quantity integer DEFAULT 1,
  is_flagged boolean DEFAULT false,
  flag_note text,
  flagged_by uuid,
  flagged_at timestamp with time zone,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  resolve_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  condition text NOT NULL DEFAULT 'Good'::text,
  CONSTRAINT room_inventory_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  location_id uuid,
  name text NOT NULL,
  display_order integer DEFAULT 0,
  layout_x integer DEFAULT 0,
  layout_y integer DEFAULT 0,
  layout_w integer DEFAULT 1,
  layout_h integer DEFAULT 1,
  primary_instruments text[],
  status text DEFAULT 'active'::text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  floor integer DEFAULT 1,
  room_type text DEFAULT 'lesson_room'::text,
  color text,
  archived_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  ai_context jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT rooms_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.schedule_blocks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  location_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  student_id uuid,
  block_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  status block_status NOT NULL DEFAULT 'available'::block_status,
  is_recurring boolean NOT NULL DEFAULT false,
  notes text,
  ai_context jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  block_type block_type NOT NULL DEFAULT 'open_time'::block_type,
  room text,
  fifth_week boolean NOT NULL DEFAULT false,
  checked_in boolean NOT NULL DEFAULT false,
  checked_in_at timestamp with time zone,
  checked_in_by uuid,
  callout_reason text,
  room_id uuid,
  teacher_tally boolean DEFAULT false,
  generated_from_availability boolean DEFAULT false,
  original_teacher_id uuid,
  original_teacher_name text,
  reminder_sent boolean DEFAULT false,
  is_virtual boolean NOT NULL DEFAULT false,
  meet_link text,
  meet_event_id text,
  converted_to_virtual_at timestamp with time zone,
  converted_by uuid,
  is_family_callout boolean DEFAULT false,
  callout_id uuid,
  is_makeup_session boolean DEFAULT false,
  makeup_session_id uuid,
  archived_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  checkin_status text DEFAULT 'scheduled'::text,
  series_id uuid,
  series_anchor boolean NOT NULL DEFAULT false,
  CONSTRAINT schedule_blocks_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.schedule_series (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  location_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  duration_blocks integer NOT NULL DEFAULT 1,
  effective_from date NOT NULL,
  effective_until date,
  last_generated date,
  is_active boolean NOT NULL DEFAULT true,
  is_recurring boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT schedule_series_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  enrollment_id uuid,
  teacher_id uuid,
  student_id uuid,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  status text NOT NULL DEFAULT 'scheduled'::text,
  location_id uuid,
  instrument text,
  day_of_week integer,
  start_time text,
  CONSTRAINT schedules_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  event text NOT NULL,
  severity text NOT NULL DEFAULT 'info'::text,
  ip text,
  user_agent text,
  request_id text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT security_events_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.services_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name character varying(255) NOT NULL,
  sub_category character varying(100),
  description text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  unit_label character varying(50) NOT NULL DEFAULT 'session'::character varying,
  is_core boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  taxable boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT services_catalog_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.session_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  schedule_block_id uuid NOT NULL,
  location_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL,
  block_date date NOT NULL,
  status text NOT NULL DEFAULT 'completed'::text,
  teacher_rate numeric(6,2) NOT NULL,
  student_rate numeric(6,2) NOT NULL,
  lesson_notes text,
  ai_summary text,
  ai_context jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  worked_on text[] DEFAULT '{}'::text[],
  engagement_level smallint,
  progress_indicator text,
  voice_note_url text,
  teacher_note text,
  communication_id uuid,
  instrument text,
  parent_update_status text DEFAULT 'pending'::text,
  payment_gated boolean NOT NULL DEFAULT false,
  archived_at timestamp with time zone,
  notes text,
  service_quality text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT session_log_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.sid_context_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  context_json jsonb NOT NULL,
  built_at timestamp with time zone DEFAULT now(),
  invalidated_at timestamp with time zone,
  CONSTRAINT sid_context_cache_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.square_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  family_id uuid,
  square_invoice_id text NOT NULL,
  square_customer_id text,
  square_location_id text,
  status text,
  amount_cents integer,
  invoice_number text,
  title text,
  scheduled_at timestamp with time zone,
  due_date date,
  paid_at timestamp with time zone,
  square_created_at timestamp with time zone,
  synced_at timestamp with time zone DEFAULT now(),
  raw_data jsonb,
  requested_amount integer,
  amount_paid integer DEFAULT 0,
  invoice_date date,
  location_id uuid,
  recurring_series_id text,
  customer_email text,
  customer_name text,
  archived_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT square_invoices_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.square_invoices_fact (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  square_invoice_id text,
  invoice_number text,
  title text,
  status text,
  family_id uuid,
  student_id uuid,
  amount_cents integer NOT NULL DEFAULT 0,
  amount_paid_cents integer NOT NULL DEFAULT 0,
  due_date date,
  paid_at timestamp with time zone,
  metadata jsonb,
  square_location_id text,
  location_id uuid,
  square_customer_id text,
  invoice_date date,
  requested_amount integer,
  customer_name text,
  customer_email text,
  recurring_series_id text,
  square_order_id text,
  synced_at timestamp with time zone,
  raw_json jsonb,
  square_created_at timestamp with time zone,
  CONSTRAINT square_invoices_fact_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.square_payments_fact (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  square_payment_id text NOT NULL,
  square_location_id text,
  location_id uuid,
  status text NOT NULL,
  source_type text,
  tender_bucket text NOT NULL,
  amount_money_cents bigint,
  tip_money_cents bigint,
  total_money_cents bigint,
  application_fee_money_cents bigint,
  processing_fee_total_cents bigint NOT NULL DEFAULT 0,
  refunded_money_cents bigint,
  net_total_cents bigint,
  reporting_date date NOT NULL,
  created_at_square timestamp with time zone,
  updated_at_square timestamp with time zone,
  raw_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  team_member_id text,
  square_order_id text,
  CONSTRAINT square_payments_fact_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.square_refunds_fact (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  square_refund_id text NOT NULL,
  square_payment_id text NOT NULL,
  square_location_id text,
  location_id uuid,
  status text,
  amount_money_cents bigint NOT NULL,
  reporting_date date NOT NULL,
  created_at_square timestamp with time zone,
  updated_at_square timestamp with time zone,
  raw_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT square_refunds_fact_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.star_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_context text NOT NULL DEFAULT 'music_school'::text,
  instructions text,
  routing_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_skill_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  approved_agent_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  delegation_mode text NOT NULL DEFAULT 'auto'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT star_config_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.star_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id text NOT NULL,
  verdict review_verdict NOT NULL,
  summary text NOT NULL,
  what_worked text,
  what_failed text,
  next_action text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT star_reviews_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.stewie_risk_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  risk_stage integer NOT NULL DEFAULT 1,
  churn_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  stage_entered_at timestamp with time zone DEFAULT now(),
  next_check_after timestamp with time zone NOT NULL,
  resolved_at timestamp with time zone,
  resolution_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stewie_risk_log_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  family_id uuid,
  stripe_customer_id text,
  email text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT stripe_customers_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.student_duplicate_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  family_id uuid NOT NULL,
  lead_id uuid,
  new_student_id uuid NOT NULL,
  candidate_existing_student_id uuid NOT NULL,
  reason text NOT NULL DEFAULT 'same_family_same_normalized_name'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_duplicate_reviews_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.student_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  family_id uuid,
  event_type text NOT NULL,
  description text NOT NULL,
  source_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  created_by_name text,
  created_by_role text,
  CONSTRAINT student_events_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.student_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  uploaded_by text,
  uploaded_by_role text DEFAULT 'admin'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  folder text NOT NULL DEFAULT 'materials'::text,
  flagged_for_deletion boolean DEFAULT false,
  flagged_by uuid,
  flagged_at timestamp with time zone,
  storage_path text,
  CONSTRAINT student_files_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.student_followups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  student_id uuid NOT NULL,
  family_id uuid NOT NULL,
  followup_date date NOT NULL,
  reason text,
  notes text,
  status text NOT NULL DEFAULT 'pending'::text,
  ai_draft text,
  sent_at timestamp with time zone,
  sent_by uuid,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_followups_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.student_instruments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  instrument text NOT NULL,
  teacher_id uuid,
  rate_per_session numeric NOT NULL DEFAULT 0,
  sessions_per_month integer NOT NULL DEFAULT 4,
  is_primary boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_instruments_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.student_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid,
  family_id uuid,
  category character varying(100) NOT NULL DEFAULT 'General'::character varying,
  content text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  admin_reviewed boolean NOT NULL DEFAULT false,
  forwarded_to_teacher boolean NOT NULL DEFAULT false,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_messages_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.student_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  author_id uuid,
  author_name text,
  author_role text DEFAULT 'teacher'::text,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  note_type text NOT NULL DEFAULT 'internal_studio'::text,
  prompt_context text,
  prompt_assignment text,
  prompt_focus text,
  file_url text,
  file_name text,
  file_size bigint,
  is_lesson_card boolean NOT NULL DEFAULT false,
  CONSTRAINT student_notes_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  family_id uuid,
  teacher_id uuid,
  lead_id uuid,
  first_name text NOT NULL DEFAULT ''::text,
  last_name text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'active'::text,
  enrollment_date timestamp with time zone,
  onboarding_stage text,
  last_attendance_at timestamp with time zone,
  attendance_streak integer DEFAULT 0,
  churn_risk text,
  location_id uuid NOT NULL,
  profile_id uuid,
  instrument text,
  date_of_birth date,
  start_date date,
  end_date date,
  blocks_per_week integer NOT NULL DEFAULT 1,
  rate_per_session numeric(6,2) NOT NULL DEFAULT 45.00,
  notes text,
  tags text[],
  ai_context jsonb DEFAULT '{}'::jsonb,
  total_fifth_weeks integer NOT NULL DEFAULT 0,
  total_callouts integer NOT NULL DEFAULT 0,
  exit_reason text,
  exit_notes text,
  may_return text,
  reactivation_date date,
  overdue_amount numeric DEFAULT 0,
  age text,
  bio text,
  first_lesson_date date,
  total_lessons_taken integer DEFAULT 0,
  total_paid numeric DEFAULT 0,
  teacher_notes text,
  sessions_per_month integer NOT NULL DEFAULT 4,
  experience text DEFAULT 'none'::text,
  has_instrument text DEFAULT 'na'::text,
  preferred_days text[],
  source text DEFAULT 'other'::text,
  pause_reason text,
  pause_reason_detail text,
  coming_back boolean,
  expected_return_date date,
  followup_date date,
  followup_sent boolean DEFAULT false,
  followup_sent_at timestamp with time zone,
  deactivated_at timestamp with time zone,
  deactivated_by uuid,
  first_teacher_id uuid,
  first_teacher_name text,
  last_teacher_id uuid,
  last_teacher_name text,
  exit_category text,
  transferred_to_location_id uuid,
  goals text,
  learning_style text,
  previous_teacher_id uuid,
  teacher_changed_at timestamp with time zone,
  student_display_id text,
  lesson_day_of_week integer,
  fifth_weeks_used integer DEFAULT 0,
  intake_submission_id uuid,
  counts_toward_family_tier boolean NOT NULL DEFAULT true,
  enrollment_type text DEFAULT 'new_enrollment'::text,
  archived_at timestamp with time zone,
  experience_level text,
  photo_url text,
  CONSTRAINT students_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.studio_closures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  location_id uuid,
  closure_date date NOT NULL,
  label text NOT NULL,
  emoji text,
  affects_billing boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT studio_closures_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.studio_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  family_id uuid NOT NULL,
  student_id uuid,
  location_id uuid,
  message_text text NOT NULL,
  direction text NOT NULL,
  sent_via text NOT NULL DEFAULT 'quo'::text,
  quo_queued boolean DEFAULT true,
  quo_delivered_at timestamp with time zone,
  to_phone text,
  from_phone text,
  sent_by_profile_id uuid,
  read boolean DEFAULT false,
  read_at timestamp with time zone,
  read_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT studio_messages_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.subscription_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  subscription_id uuid NOT NULL,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_amount_cents integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT subscription_items_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  family_id uuid,
  student_id uuid,
  billing_plan_id uuid,
  status text NOT NULL DEFAULT 'active'::text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  next_invoice_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancel_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  subscription_plan_id uuid,
  CONSTRAINT subscriptions_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.system_health (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  component text NOT NULL,
  status text NOT NULL DEFAULT 'healthy'::text,
  metrics jsonb,
  checked_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT system_health_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.teacher_availability (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  location_id uuid NOT NULL,
  day_of_week day_of_week NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teacher_availability_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.teacher_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  location_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  is_regular boolean NOT NULL DEFAULT false,
  can_sub boolean NOT NULL DEFAULT false,
  CONSTRAINT teacher_locations_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.teacher_room_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  teacher_id uuid,
  room_id uuid,
  location_id uuid,
  assignment_date date,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  day_of_week text,
  is_recurring boolean NOT NULL DEFAULT false,
  CONSTRAINT teacher_room_assignments_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.teacher_w9 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  tenant_id text NOT NULL,
  legal_name text NOT NULL,
  business_name text,
  tax_classification text NOT NULL,
  tax_classification_other text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  tin_type text NOT NULL,
  tin_encrypted text NOT NULL,
  tin_last_four text NOT NULL,
  signature_name text NOT NULL,
  exempt_payee_code text,
  fatca_exemption_code text,
  signed_at timestamp with time zone DEFAULT now(),
  signed_by_ip text,
  status text DEFAULT 'complete'::text,
  pdf_url text,
  pdf_generated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teacher_w9_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'active'::text,
  profile_id uuid,
  instruments text[],
  bio text,
  rate_per_block numeric(6,2) NOT NULL DEFAULT 15.00,
  is_active boolean NOT NULL DEFAULT true,
  hire_date date,
  termination_date date,
  ai_context jsonb DEFAULT '{}'::jsonb,
  is_sub_available boolean NOT NULL DEFAULT false,
  sub_available boolean DEFAULT false,
  square_team_member_id text,
  display_name text,
  teacher_role text DEFAULT 'Music Teacher'::text,
  photo_url text,
  pay_rate_per_half_hour numeric DEFAULT 15,
  internal_match_notes text,
  personality text,
  lesson_style text,
  best_age_range text,
  needs_1099 boolean NOT NULL DEFAULT false,
  documents_locked boolean NOT NULL DEFAULT true,
  w9_status text DEFAULT 'missing'::text,
  w9_completed_at timestamp with time zone,
  contract_status text DEFAULT 'missing'::text,
  contract_signed_at timestamp with time zone,
  contract_pdf_url text,
  primary_instruments text,
  secondary_instruments text,
  style_genre_strengths text,
  preferred_age_range text,
  acceptable_age_range text,
  skill_levels_by_instrument text,
  teaching_strengths text,
  musical_strengths_background text,
  best_first_lesson_fit text,
  best_match_students text,
  use_caution_internal_placement_notes text,
  meet_and_greet_fit text,
  substitute_coverage text,
  customer_facing_match_summary text,
  internal_matching_tags text,
  director_notes text,
  archived_at timestamp with time zone,
  CONSTRAINT teachers_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.tenant_agent_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  director_name text,
  studio_name text,
  monthly_price text,
  military_price text,
  multi_student_price text,
  registration_link text,
  google_review_link text,
  years_open text,
  tagline text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tenant_agent_config_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.tenant_settings (
  tenant_id text NOT NULL,
  lead_pipeline jsonb DEFAULT '{}'::jsonb,
  trial_pipeline jsonb DEFAULT '{}'::jsonb,
  enrollment_pipeline jsonb DEFAULT '{}'::jsonb,
  retention_pipeline jsonb DEFAULT '{}'::jsonb,
  kpi_settings jsonb DEFAULT '{}'::jsonb,
  schedule jsonb DEFAULT '{}'::jsonb,
  pipelines jsonb DEFAULT '{"lead": true, "trial": true, "retention": true, "enrollment": true}'::jsonb,
  events jsonb DEFAULT '{"disabled": []}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tenant_settings_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.tenants (
  id text NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#D4226A'::text,
  accent_color text DEFAULT '#FF5500'::text,
  timezone text NOT NULL DEFAULT 'America/Chicago'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text DEFAULT 'trial'::text,
  trial_ends_at timestamp with time zone,
  billing_email text,
  location_count_billed integer DEFAULT 1,
  onboarding_emails_sent jsonb DEFAULT '{}'::jsonb,
  pricing_tier text DEFAULT 'school'::text,
  onboarding_progress jsonb DEFAULT '{"step": "welcome", "completed": []}'::jsonb,
  stripe_connect_account_id text,
  stripe_connect_status text DEFAULT 'not_connected'::text,
  CONSTRAINT tenants_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.touches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid,
  type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  source text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT touches_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.trials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  student_id uuid,
  lead_id uuid,
  scheduled_at timestamp with time zone,
  status text DEFAULT 'scheduled'::text,
  attended boolean,
  last_reminded_at timestamp with time zone,
  inactivity_bucket text,
  enrollment_decision text,
  CONSTRAINT trials_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.usage_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  subscription_id uuid,
  student_id uuid,
  metric text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT usage_records_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.value_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  family_id uuid,
  location_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  attendance_rate numeric(5,2),
  total_sessions_period integer NOT NULL DEFAULT 0,
  attended_sessions_period integer NOT NULL DEFAULT 0,
  total_sessions_lifetime integer NOT NULL DEFAULT 0,
  months_enrolled integer NOT NULL DEFAULT 0,
  percentile_rank integer,
  teacher_highlights jsonb DEFAULT '[]'::jsonb,
  skills_worked_on jsonb DEFAULT '[]'::jsonb,
  milestones jsonb DEFAULT '[]'::jsonb,
  ai_summary text,
  instrument text,
  teacher_name text,
  sent_at timestamp with time zone,
  sent_via text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT value_cards_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.vault_delivery_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fulfillment_event_id uuid,
  vault_user_id uuid,
  channel text NOT NULL,
  recipient text NOT NULL,
  provider text,
  provider_message_id text,
  status text NOT NULL DEFAULT 'queued'::text,
  error_code text,
  error_message text,
  payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  CONSTRAINT vault_delivery_attempts_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.vault_fulfillment_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'square'::text,
  provider_event_id text,
  provider_event_type text,
  provider_payment_id text,
  provider_order_id text,
  provider_customer_id text,
  buyer_email text,
  buyer_phone text,
  buyer_first_name text,
  buyer_last_name text,
  canonical_product_slug text,
  vault_product_slug text,
  amount_cents integer,
  currency text DEFAULT 'USD'::text,
  dry_run boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'received'::text,
  error_code text,
  error_message text,
  raw_event jsonb NOT NULL,
  parsed_payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  CONSTRAINT vault_fulfillment_events_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.vault_product_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  content_type text NOT NULL,
  content_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  lesson_id text,
  CONSTRAINT vault_product_modules_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.vault_product_square_map (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  canonical_product_slug text NOT NULL,
  vault_product_slug text NOT NULL,
  square_link_code text,
  square_link_url text,
  square_catalog_object_id text,
  square_variation_id text,
  expected_price_cents integer,
  is_bundle boolean NOT NULL DEFAULT false,
  grant_slugs text[] NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  square_checkout_id text,
  CONSTRAINT vault_product_square_map_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.vault_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  slug text NOT NULL,
  image_url text,
  price_cents integer NOT NULL DEFAULT 4700,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vault_products_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.vault_user_module_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone,
  last_accessed_at timestamp with time zone,
  viewed_at timestamp with time zone,
  CONSTRAINT vault_user_module_progress_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.vault_user_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vault_user_products_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.vault_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text,
  license_key text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'::text),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login timestamp with time zone,
  CONSTRAINT vault_users_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.verticals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  label text NOT NULL,
  subdomain text NOT NULL,
  primary_color text NOT NULL,
  headline text NOT NULL,
  subheadline text NOT NULL,
  terminology jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT verticals_pkey PRIMARY KEY ()
);

CREATE TABLE IF NOT EXISTS public.ziro_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_id text NOT NULL,
  tenant_id text NOT NULL DEFAULT ''::text,
  event_type text NOT NULL,
  agent_assigned text NOT NULL,
  input_summary text,
  output_summary text,
  status text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  duration_ms bigint,
  tokens_used integer,
  error_message text,
  CONSTRAINT ziro_events_pkey PRIMARY KEY ()
);


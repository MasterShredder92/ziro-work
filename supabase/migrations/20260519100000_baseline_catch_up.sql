-- =============================================================================
-- BASELINE CATCH-UP: Sync 33 live migrations missing from local repo
-- Generated: 2026-05-19
-- These migrations were applied directly to the live DB without corresponding
-- repo files. This migration is IDEMPOTENT (IF NOT EXISTS everywhere).
-- Live project: gngbyydqjouxkoprzzil
-- =============================================================================

-- -----------------------------------------------------------------------
-- NEW TABLES (from missing migrations 20260424125258 through 20260519003127)
-- -----------------------------------------------------------------------

-- recurring_lessons
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
  room_id uuid
);
ALTER TABLE public.recurring_lessons ENABLE ROW LEVEL SECURITY;

-- schedule_series
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
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.schedule_series ENABLE ROW LEVEL SECURITY;

-- error_resolution_logs
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
  notes text
);
ALTER TABLE public.error_resolution_logs ENABLE ROW LEVEL SECURITY;

-- tenant_agent_config
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
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_agent_config ENABLE ROW LEVEL SECURITY;

-- metric_snapshots
CREATE TABLE IF NOT EXISTS public.metric_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source text NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.metric_snapshots ENABLE ROW LEVEL SECURITY;

-- vault_products
CREATE TABLE IF NOT EXISTS public.vault_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  slug text NOT NULL,
  image_url text,
  price_cents integer NOT NULL DEFAULT 4700,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.vault_products ENABLE ROW LEVEL SECURITY;

-- vault_product_modules
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
  lesson_id text
);
ALTER TABLE public.vault_product_modules ENABLE ROW LEVEL SECURITY;

-- vault_product_square_map
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
  square_checkout_id text
);
ALTER TABLE public.vault_product_square_map ENABLE ROW LEVEL SECURITY;

-- vault_users
CREATE TABLE IF NOT EXISTS public.vault_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text,
  license_key text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'::text),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login timestamp with time zone
);
ALTER TABLE public.vault_users ENABLE ROW LEVEL SECURITY;

-- vault_user_products
CREATE TABLE IF NOT EXISTS public.vault_user_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  purchased_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.vault_user_products ENABLE ROW LEVEL SECURITY;

-- vault_user_module_progress
CREATE TABLE IF NOT EXISTS public.vault_user_module_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone,
  last_accessed_at timestamp with time zone,
  viewed_at timestamp with time zone
);
ALTER TABLE public.vault_user_module_progress ENABLE ROW LEVEL SECURITY;

-- vault_fulfillment_events
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
  processed_at timestamp with time zone
);
ALTER TABLE public.vault_fulfillment_events ENABLE ROW LEVEL SECURITY;

-- vault_delivery_attempts
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
  sent_at timestamp with time zone
);
ALTER TABLE public.vault_delivery_attempts ENABLE ROW LEVEL SECURITY;

-- student_events
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
  created_by_role text
);
ALTER TABLE public.student_events ENABLE ROW LEVEL SECURITY;

-- student_duplicate_reviews
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
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.student_duplicate_reviews ENABLE ROW LEVEL SECURITY;

-- student_instruments
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
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.student_instruments ENABLE ROW LEVEL SECURITY;

-- value_cards
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
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.value_cards ENABLE ROW LEVEL SECURITY;

-- issues
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
  user_friendly_category character varying(100)
);
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- studio_closures
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
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.studio_closures ENABLE ROW LEVEL SECURITY;

-- studio_messages
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
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.studio_messages ENABLE ROW LEVEL SECURITY;

-- raven_message_log
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
  retry_count integer NOT NULL DEFAULT 0
);
ALTER TABLE public.raven_message_log ENABLE ROW LEVEL SECURITY;

-- raven_knowledge_base
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
  channel text NOT NULL DEFAULT 'sms'::text
);
ALTER TABLE public.raven_knowledge_base ENABLE ROW LEVEL SECURITY;

-- raven_escalations
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
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.raven_escalations ENABLE ROW LEVEL SECURITY;

-- star_config
CREATE TABLE IF NOT EXISTS public.star_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_context text NOT NULL DEFAULT 'music_school'::text,
  instructions text,
  routing_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_skill_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  approved_agent_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  delegation_mode text NOT NULL DEFAULT 'auto'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.star_config ENABLE ROW LEVEL SECURITY;

-- star_reviews
CREATE TABLE IF NOT EXISTS public.star_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id text NOT NULL,
  verdict review_verdict NOT NULL,
  summary text NOT NULL,
  what_worked text,
  what_failed text,
  next_action text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.star_reviews ENABLE ROW LEVEL SECURITY;

-- stewie_risk_log
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
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.stewie_risk_log ENABLE ROW LEVEL SECURITY;

-- ziro_events
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
  error_message text
);
ALTER TABLE public.ziro_events ENABLE ROW LEVEL SECURITY;

-- agent_tenants
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
  integrations_enabled jsonb NOT NULL DEFAULT '{"square": false, "openphone": false, "website_form": false}'::jsonb
);
ALTER TABLE public.agent_tenants ENABLE ROW LEVEL SECURITY;

-- onboarding_sequences
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
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_sequences ENABLE ROW LEVEL SECURITY;

-- pricing_tiers
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
  max_teachers integer
);
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- invoice_tokens
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
  is_prorated boolean DEFAULT false
);
ALTER TABLE public.invoice_tokens ENABLE ROW LEVEL SECURITY;

-- invoice_flags
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
  resolution_notes text
);
ALTER TABLE public.invoice_flags ENABLE ROW LEVEL SECURITY;

-- invoice_line_items
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
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- square_invoices_fact
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
  square_created_at timestamp with time zone
);
ALTER TABLE public.square_invoices_fact ENABLE ROW LEVEL SECURITY;

-- recruitment_prospects
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
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.recruitment_prospects ENABLE ROW LEVEL SECURITY;

-- integration_events
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
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

-- contacts
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
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- customers
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
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- touches
CREATE TABLE IF NOT EXISTS public.touches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid,
  type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  source text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.touches ENABLE ROW LEVEL SECURITY;

-- teacher_w9
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
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.teacher_w9 ENABLE ROW LEVEL SECURITY;

-- teacher_room_assignments
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
  is_recurring boolean NOT NULL DEFAULT false
);
ALTER TABLE public.teacher_room_assignments ENABLE ROW LEVEL SECURITY;

-- privacy_violation_log
CREATE TABLE IF NOT EXISTS public.privacy_violation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  teacher_id uuid,
  student_id uuid,
  requested_field text NOT NULL,
  query_text text,
  blocked boolean DEFAULT true,
  detected_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.privacy_violation_log ENABLE ROW LEVEL SECURITY;

-- rate_limit_hits
CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_id text NOT NULL,
  tenant_id uuid,
  ip text,
  route text,
  key text NOT NULL,
  max_allowed integer NOT NULL,
  window_ms integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;

-- operator_sessions
CREATE TABLE IF NOT EXISTS public.operator_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  active_location_id uuid,
  active_date date DEFAULT CURRENT_DATE,
  active_view text DEFAULT 'schedule'::text,
  active_modal text DEFAULT 'none'::text,
  focused_block_id uuid,
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.operator_sessions ENABLE ROW LEVEL SECURITY;

-- pending_reminders
CREATE TABLE IF NOT EXISTS public.pending_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL,
  reminder_type text NOT NULL,
  fire_at timestamp with time zone NOT NULL,
  fired boolean NOT NULL DEFAULT false,
  cancelled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.pending_reminders ENABLE ROW LEVEL SECURITY;

-- sid_context_cache
CREATE TABLE IF NOT EXISTS public.sid_context_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  context_json jsonb NOT NULL,
  built_at timestamp with time zone DEFAULT now(),
  invalidated_at timestamp with time zone
);
ALTER TABLE public.sid_context_cache ENABLE ROW LEVEL SECURITY;

-- system_health
CREATE TABLE IF NOT EXISTS public.system_health (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  component text NOT NULL,
  status text NOT NULL DEFAULT 'healthy'::text,
  metrics jsonb,
  checked_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- anchor_job_locks
CREATE TABLE IF NOT EXISTS public.anchor_job_locks (
  job_id text NOT NULL,
  acquired_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL
);
ALTER TABLE public.anchor_job_locks ENABLE ROW LEVEL SECURITY;

-- stripe_customers
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  family_id uuid,
  stripe_customer_id text,
  email text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------
-- COLUMN ADDITIONS to existing tables (from missing migrations)
-- -----------------------------------------------------------------------

-- teacher_locations: is_regular + can_sub (20260424145539)
ALTER TABLE public.teacher_locations ADD COLUMN IF NOT EXISTS is_regular boolean NOT NULL DEFAULT false;
ALTER TABLE public.teacher_locations ADD COLUMN IF NOT EXISTS can_sub boolean NOT NULL DEFAULT false;

-- student_notes: note_type + lesson card fields (20260424131303 + later)
ALTER TABLE public.student_notes ADD COLUMN IF NOT EXISTS note_type text NOT NULL DEFAULT 'internal_studio';
ALTER TABLE public.student_notes ADD COLUMN IF NOT EXISTS prompt_context text;
ALTER TABLE public.student_notes ADD COLUMN IF NOT EXISTS prompt_assignment text;
ALTER TABLE public.student_notes ADD COLUMN IF NOT EXISTS prompt_focus text;
ALTER TABLE public.student_notes ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.student_notes ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.student_notes ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE public.student_notes ADD COLUMN IF NOT EXISTS is_lesson_card boolean NOT NULL DEFAULT false;

-- schedule_blocks: series tracking + checkin status (20260424162636)
ALTER TABLE public.schedule_blocks ADD COLUMN IF NOT EXISTS series_id uuid;
ALTER TABLE public.schedule_blocks ADD COLUMN IF NOT EXISTS series_anchor boolean NOT NULL DEFAULT false;
ALTER TABLE public.schedule_blocks ADD COLUMN IF NOT EXISTS checkin_status text DEFAULT 'scheduled';

-- teacher_room_assignments: day_of_week + is_recurring (20260425114906)
ALTER TABLE public.teacher_room_assignments ADD COLUMN IF NOT EXISTS day_of_week text;
ALTER TABLE public.teacher_room_assignments ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false;

-- invoices: pdf fields (20260502193905)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS pdf_generated_at timestamp with time zone;

-- invoices: square push fields (20260502205651)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS square_invoice_id text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS square_order_id text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS square_public_url text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS square_pushed_at timestamp with time zone;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS square_push_error text;

-- vault_product_modules: lesson_id (20260514005111)
ALTER TABLE public.vault_product_modules ADD COLUMN IF NOT EXISTS lesson_id text;

-- vault_product_square_map: square_checkout_id (20260519003127)
ALTER TABLE public.vault_product_square_map ADD COLUMN IF NOT EXISTS square_checkout_id text;

-- -----------------------------------------------------------------------
-- INDEXES (20260503045422 + 20260511231918)
-- -----------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_schedule_blocks_tenant_date_location ON public.schedule_blocks (tenant_id, block_date, location_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_teacher_date ON public.schedule_blocks (teacher_id, block_date);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_student_date ON public.schedule_blocks (student_id, block_date);
CREATE INDEX IF NOT EXISTS idx_students_tenant_status ON public.students (tenant_id, status) WHERE status = 'active';

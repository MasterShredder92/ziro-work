-- Auto-generated target bootstrap for missing critical tables

create extension if not exists "pgcrypto";

do $$ begin if not exists (select 1 from pg_type where typname = 'user_role') then create type public."user_role" as enum ('owner', 'admin', 'teacher', 'parent', 'student', 'company_director', 'studio_director'); end if; end $$;

do $$ begin if not exists (select 1 from pg_type where typname = 'day_of_week') then create type public."day_of_week" as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'); end if; end $$;

do $$ begin if not exists (select 1 from pg_type where typname = 'lead_stage') then create type public."lead_stage" as enum ('inquiry', 'contacted', 'scheduled', 'enrolled', 'lost'); end if; end $$;

do $$ begin if not exists (select 1 from pg_type where typname = 'block_status') then create type public."block_status" as enum ('available', 'booked'); end if; end $$;

do $$ begin if not exists (select 1 from pg_type where typname = 'block_type') then create type public."block_type" as enum ('open_time', 'student_session', 'first_day', 'last_day', 'not_bookable', 'sub', 'call_out', 'meet_greet', 'teacher_training', 'makeup_session', 'virtual'); end if; end $$;

create table if not exists public."tenants" (
  "id" uuid default uuid_generate_v4() not null,
  "name" text not null,
  "slug" text not null,
  "logo_url" text,
  "primary_color" text default '#D4226A'::text,
  "accent_color" text default '#FF5500'::text,
  "timezone" text default 'America/Chicago'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "plan" text default 'trial'::text,
  "trial_ends_at" timestamp with time zone,
  "billing_email" text,
  "location_count_billed" integer default 1,
  "onboarding_emails_sent" jsonb default '{}'::jsonb,
  "pricing_tier" text default 'school'::text,
  "onboarding_progress" jsonb default '{"step": "welcome", "completed": []}'::jsonb,
  "stripe_connect_account_id" text,
  "stripe_connect_status" text default 'not_connected'::text,
  primary key ("id")
);

create table if not exists public."permission_definitions" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "category" text not null,
  "key" text not null,
  "label" text not null,
  "description" text,
  "owner_default" boolean default true,
  "company_director_default" boolean default true,
  "studio_director_default" boolean default false,
  "teacher_default" boolean default false,
  "parent_default" boolean default false,
  "sort_order" integer default 0,
  "created_at" timestamp with time zone default now(),
  primary key ("id")
);

create table if not exists public."locations" (
  "id" uuid default uuid_generate_v4() not null,
  "tenant_id" uuid not null,
  "name" text not null,
  "address" text not null,
  "city" text not null,
  "state" text default 'NE'::text not null,
  "zip" text not null,
  "phone" text,
  "email" text,
  "website" text,
  "google_review_url" text,
  "hours_json" jsonb,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "logo_url" text,
  "color" text default '#D4226A'::text,
  "state_rank" integer,
  "students_enrolled" integer,
  "students_taught_total" integer,
  "floorplan_cols" integer default 16,
  "floorplan_rows" integer default 8,
  "min_floors" integer default 1,
  "square_location_id" text,
  primary key ("id")
);

create table if not exists public."brand_settings" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "location_id" uuid,
  "logo_circle_path" text,
  "logo_wide_path" text,
  "logo_favicon_path" text,
  "primary_color" text,
  "secondary_color" text,
  "background_color" text,
  "studio_name" text,
  "tagline" text,
  "website_domain" text,
  "phone" text,
  "email" text,
  "address_line1" text,
  "address_city" text,
  "address_state" text,
  "address_zip" text,
  "google_maps_url" text,
  "facebook_url" text,
  "instagram_url" text,
  "tiktok_url" text,
  "youtube_url" text,
  "ga4_id" text,
  "meta_pixel_id" text,
  "tiktok_pixel_id" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."location_hours" (
  "id" uuid default gen_random_uuid() not null,
  "location_id" uuid not null,
  "day_of_week" integer not null,
  "open_time" time without time zone not null,
  "close_time" time without time zone not null,
  "is_closed" boolean default false,
  primary key ("id")
);

create table if not exists public."families" (
  "id" uuid default uuid_generate_v4() not null,
  "tenant_id" uuid not null,
  "name" text not null,
  "primary_contact_name" text,
  "primary_email" text,
  "primary_phone" text,
  "billing_notes" text,
  "is_military" boolean default false not null,
  "profile_id" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "card_last_four" text,
  "card_brand" text,
  "square_customer_id" text,
  "square_card_id" text,
  "card_exp_month" integer,
  "card_exp_year" integer,
  "billing_day" integer default 1,
  "billing_status" text default 'active'::text not null,
  "balance" integer default 0 not null,
  "parent_name" text,
  "rate_tier" integer default 4500 not null,
  "rate_tier_override" boolean default false not null,
  "rate_tier_override_by" uuid,
  "rate_tier_override_at" timestamp with time zone,
  "rate_tier_reason" text,
  "primary_location_id" uuid,
  "parent_first_name" text,
  "parent_last_name" text,
  "emergency_contact_name" text,
  "emergency_contact_phone" text,
  "emergency_contact_relationship" text,
  "scheduling_notes" text,
  "lifetime_paid_cents" integer default 0 not null,
  "overdue_balance_cents" integer default 0 not null,
  "stripe_customer_id_connect" text,
  "autopay_enabled" boolean default false,
  "default_payment_method_id" text,
  "notify_via_sms" boolean default true not null,
  "notify_via_email" boolean default true not null,
  "reminder_4hr" boolean default true not null,
  "reminder_1hr" boolean default false not null,
  "sms_opted_out" boolean default false,
  "referral_code" text,
  "referred_by_family_id" uuid,
  "referral_count" integer default 0,
  "archived_at" timestamp with time zone,
  "primary_contact_email" text,
  "primary_contact_phone" text,
  "status" text default 'active'::text,
  "notes" text,
  primary key ("id")
);

create table if not exists public."teachers" (
  "id" uuid default uuid_generate_v4() not null,
  "tenant_id" uuid not null,
  "profile_id" uuid,
  "instruments" text[] not null,
  "bio" text,
  "rate_per_block" numeric(6,2) default 15.00 not null,
  "is_active" boolean default true not null,
  "hire_date" date,
  "termination_date" date,
  "ai_context" jsonb default '{}'::jsonb,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "is_sub_available" boolean default false not null,
  "sub_available" boolean default false,
  "square_team_member_id" text,
  "first_name" text,
  "last_name" text,
  "email" text,
  "phone" text,
  "display_name" text,
  "teacher_role" text default 'Music Teacher'::text,
  "photo_url" text,
  "status" text default 'active'::text,
  "pay_rate_per_half_hour" numeric default 15,
  "internal_match_notes" text,
  "personality" text,
  "lesson_style" text,
  "best_age_range" text,
  "needs_1099" boolean default false not null,
  "documents_locked" boolean default true not null,
  "w9_status" text default 'missing'::text,
  "w9_completed_at" timestamp with time zone,
  "contract_status" text default 'missing'::text,
  "contract_signed_at" timestamp with time zone,
  "contract_pdf_url" text,
  "primary_instruments" text,
  "secondary_instruments" text,
  "style_genre_strengths" text,
  "preferred_age_range" text,
  "acceptable_age_range" text,
  "skill_levels_by_instrument" text,
  "teaching_strengths" text,
  "musical_strengths_background" text,
  "best_first_lesson_fit" text,
  "best_match_students" text,
  "use_caution_internal_placement_notes" text,
  "meet_and_greet_fit" text,
  "substitute_coverage" text,
  "customer_facing_match_summary" text,
  "internal_matching_tags" text,
  "director_notes" text,
  "archived_at" timestamp with time zone,
  primary key ("id")
);

create table if not exists public."profiles" (
  "id" uuid not null,
  "tenant_id" uuid not null,
  "role" user_role not null,
  "first_name" text not null,
  "last_name" text not null,
  "email" text,
  "phone" text,
  "avatar_url" text,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "export_pin" text,
  "is_platform_admin" boolean default false,
  "onboarding_completed_at" timestamp with time zone,
  "onboarding_skipped" boolean default false,
  primary key ("id")
);

create table if not exists public."profile_locations" (
  "id" uuid default uuid_generate_v4() not null,
  "profile_id" uuid not null,
  "location_id" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."teacher_locations" (
  "id" uuid default gen_random_uuid() not null,
  "teacher_id" uuid not null,
  "location_id" uuid not null,
  "created_at" timestamp with time zone default now(),
  primary key ("id")
);

create table if not exists public."rooms" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid,
  "location_id" uuid,
  "name" text not null,
  "display_order" integer default 0,
  "layout_x" integer default 0,
  "layout_y" integer default 0,
  "layout_w" integer default 1,
  "layout_h" integer default 1,
  "primary_instruments" text[],
  "status" text default 'active'::text,
  "notes" text,
  "is_active" boolean default true,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "floor" integer default 1,
  "room_type" text default 'lesson_room'::text,
  "color" text,
  "archived_at" timestamp with time zone,
  "metadata" jsonb default '{}'::jsonb,
  primary key ("id")
);

create table if not exists public."room_inventory" (
  "id" uuid default gen_random_uuid() not null,
  "room_id" uuid,
  "tenant_id" uuid,
  "item_name" text not null,
  "quantity" integer default 1,
  "is_flagged" boolean default false,
  "flag_note" text,
  "flagged_by" uuid,
  "flagged_at" timestamp with time zone,
  "resolved_by" uuid,
  "resolved_at" timestamp with time zone,
  "resolve_reason" text,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "condition" text default 'Good'::text not null,
  primary key ("id")
);

create table if not exists public."teacher_room_assignments" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid,
  "teacher_id" uuid,
  "room_id" uuid,
  "location_id" uuid,
  "assignment_date" date not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now(),
  primary key ("id")
);

create table if not exists public."teacher_availability" (
  "id" uuid default uuid_generate_v4() not null,
  "tenant_id" uuid not null,
  "teacher_id" uuid not null,
  "location_id" uuid not null,
  "day_of_week" day_of_week not null,
  "start_time" time without time zone not null,
  "end_time" time without time zone not null,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."students" (
  "id" uuid default uuid_generate_v4() not null,
  "tenant_id" uuid not null,
  "family_id" uuid,
  "location_id" uuid,
  "teacher_id" uuid,
  "profile_id" uuid,
  "first_name" text not null,
  "last_name" text not null,
  "instrument" text,
  "status" text default 'active'::text not null,
  "date_of_birth" date,
  "start_date" date,
  "end_date" date,
  "blocks_per_week" integer default 1 not null,
  "rate_per_session" numeric(6,2) default 45.00 not null,
  "notes" text,
  "tags" text[],
  "ai_context" jsonb default '{}'::jsonb,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "total_fifth_weeks" integer default 0 not null,
  "total_callouts" integer default 0 not null,
  "exit_reason" text,
  "exit_notes" text,
  "may_return" text,
  "reactivation_date" date,
  "overdue_amount" numeric default 0,
  "age" text,
  "bio" text,
  "first_lesson_date" date,
  "card_last_four" text,
  "card_brand" text,
  "total_lessons_taken" integer default 0,
  "total_paid" numeric default 0,
  "teacher_notes" text,
  "sessions_per_month" integer default 4 not null,
  "experience" text default 'none'::text,
  "has_instrument" text default 'na'::text,
  "preferred_days" text[],
  "source" text default 'other'::text,
  "is_military" boolean default false,
  "pause_reason" text,
  "pause_reason_detail" text,
  "coming_back" boolean,
  "expected_return_date" date,
  "followup_date" date,
  "followup_sent" boolean default false,
  "followup_sent_at" timestamp with time zone,
  "deactivated_at" timestamp with time zone,
  "deactivated_by" uuid,
  "first_teacher_id" uuid,
  "first_teacher_name" text,
  "last_teacher_id" uuid,
  "last_teacher_name" text,
  "exit_category" text,
  "transferred_to_location_id" uuid,
  "goals" text,
  "learning_style" text,
  "previous_teacher_id" uuid,
  "teacher_changed_at" timestamp with time zone,
  "student_display_id" text,
  "square_customer_id" text,
  "lesson_day_of_week" integer,
  "fifth_weeks_used" integer default 0,
  "intake_submission_id" uuid,
  "counts_toward_family_tier" boolean default true not null,
  "enrollment_type" text default 'new_enrollment'::text,
  "email" text,
  "phone" text,
  "archived_at" timestamp with time zone,
  primary key ("id")
);

create table if not exists public."addresses" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "entity_type" text not null,
  "entity_id" uuid not null,
  "line1" text,
  "line2" text,
  "city" text,
  "state" text,
  "postal_code" text,
  "country" text,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  primary key ("id")
);

create table if not exists public."student_instruments" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "student_id" uuid not null,
  "instrument" text not null,
  "teacher_id" uuid,
  "rate_per_session" numeric default 0 not null,
  "sessions_per_month" integer default 4 not null,
  "is_primary" boolean default false not null,
  "status" text default 'active'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."student_followups" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "student_id" uuid not null,
  "family_id" uuid not null,
  "followup_date" date not null,
  "reason" text,
  "notes" text,
  "status" text default 'pending'::text not null,
  "ai_draft" text,
  "sent_at" timestamp with time zone,
  "sent_by" uuid,
  "created_by" uuid,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  primary key ("id")
);

create table if not exists public."student_duplicate_reviews" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "family_id" uuid not null,
  "lead_id" uuid,
  "new_student_id" uuid not null,
  "candidate_existing_student_id" uuid not null,
  "reason" text default 'same_family_same_normalized_name'::text not null,
  "status" text default 'pending'::text not null,
  "resolved_at" timestamp with time zone,
  "resolved_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."enrollments" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "student_id" uuid not null,
  "teacher_id" uuid not null,
  "start_date" date,
  "end_date" date,
  "status" text default 'active'::text not null,
  "archived_at" timestamp with time zone,
  "notes" text,
  "metadata" jsonb default '{}'::jsonb,
  primary key ("id")
);

create table if not exists public."studio_closures" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "location_id" uuid,
  "closure_date" date not null,
  "label" text not null,
  "emoji" text,
  "affects_billing" boolean default true,
  "created_by" uuid,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  primary key ("id")
);

create table if not exists public."files" (
  "id" uuid default uuid_generate_v4() not null,
  "tenant_id" uuid not null,
  "student_id" uuid not null,
  "uploaded_by" uuid not null,
  "file_name" text not null,
  "file_path" text not null,
  "file_type" text,
  "file_size" integer,
  "description" text,
  "is_visible_to_parent" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."family_files" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "family_id" uuid not null,
  "file_type" text not null,
  "file_name" text not null,
  "file_url" text not null,
  "file_size_bytes" integer,
  "uploaded_by" uuid,
  "notes" text,
  "created_at" timestamp with time zone default now(),
  "signwell_document_id" text,
  "signwell_status" text default 'completed'::text,
  "source" text default 'manual'::text,
  primary key ("id")
);

create table if not exists public."student_files" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "student_id" uuid not null,
  "file_name" text not null,
  "file_url" text not null,
  "file_size" integer,
  "uploaded_by" text,
  "uploaded_by_role" text default 'admin'::text,
  "created_at" timestamp with time zone default now() not null,
  "folder" text default 'materials'::text not null,
  "flagged_for_deletion" boolean default false,
  "flagged_by" uuid,
  "flagged_at" timestamp with time zone,
  primary key ("id")
);

create table if not exists public."leads" (
  "id" uuid default uuid_generate_v4() not null,
  "tenant_id" uuid not null,
  "location_id" uuid,
  "first_name" text not null,
  "last_name" text,
  "parent_name" text,
  "email" text,
  "phone" text,
  "instrument" text,
  "age" text,
  "goals" text,
  "preferred_days" text[],
  "preferred_times" text,
  "stage" lead_stage default 'inquiry'::lead_stage not null,
  "source" text,
  "how_heard" text,
  "is_military" boolean default false not null,
  "assigned_teacher_id" uuid,
  "matched_block_id" uuid,
  "converted_student_id" uuid,
  "follow_up_count" integer default 0 not null,
  "last_contact_at" timestamp with time zone,
  "next_follow_up_at" timestamp with time zone,
  "notes" text,
  "tags" text[],
  "ai_context" jsonb default '{}'::jsonb,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "next_action" text,
  "assigned_to" uuid,
  "age_range" text,
  "experience" text,
  "has_instrument" text,
  "preferred_locations" text[],
  "personality_notes" text,
  "student_name" text,
  "compatibility_score" integer,
  "source_page" text,
  "matched_teacher_id" uuid,
  "secondary_location_ids" uuid[],
  "family_id" uuid,
  "lost_reason" text,
  "lost_category" text,
  "submission_id" uuid,
  "referral_code_used" text,
  "referred_by_family_id" uuid,
  "intake_submission_id" uuid,
  primary key ("id")
);

create table if not exists public."intake_submissions" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "location_id" uuid,
  "source" text default 'website_form'::text not null,
  "form_version" text default '1'::text not null,
  "raw_payload" jsonb not null,
  "lead_ids" uuid[] default '{}'::uuid[] not null,
  "converted_student_id" uuid,
  "created_at" timestamp with time zone default now() not null,
  "archived_at" timestamp with time zone,
  "status" text default 'new'::text,
  "metadata" jsonb default '{}'::jsonb,
  primary key ("id")
);

create table if not exists public."issues" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "reported_by" uuid not null,
  "reported_by_role" text not null,
  "page" text not null,
  "section" text not null,
  "element_description" text not null,
  "title" text not null,
  "description" text not null,
  "screenshot_path" text,
  "category" text default 'bug'::text not null,
  "severity" text default 'normal'::text not null,
  "status" text default 'reported'::text not null,
  "resolution_notes" text,
  "resolved_at" timestamp with time zone,
  "resolved_by" text,
  "related_issue_id" uuid,
  "pipeline_prompt" text,
  "pipeline_started_at" timestamp with time zone,
  "pipeline_completed_at" timestamp with time zone,
  "deploy_status" text default 'pending'::text,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "platform" text default 'both'::text,
  "reported_from_url" text,
  "reported_screen_width" integer,
  "reported_screen_height" integer,
  "subsection" text,
  "steps_to_reproduce" text,
  "user_friendly_category" character varying(100),
  primary key ("id")
);

create table if not exists public."invoices" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "family_id" uuid not null,
  "amount_cents" integer default 0 not null,
  "currency" text default 'USD'::text not null,
  "status" text default 'draft'::text not null,
  "due_date" date,
  primary key ("id")
);

create table if not exists public."invoice_flags" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "invoice_token_id" uuid not null,
  "family_id" uuid not null,
  "reason" text not null,
  "flagged_at" timestamp with time zone default now(),
  "status" text default 'open'::text not null,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "resolution_notes" text,
  primary key ("id")
);

create table if not exists public."invoice_tokens" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "family_id" uuid not null,
  "token" text default encode(gen_random_bytes(32), 'hex'::text) not null,
  "billing_period_label" text,
  "amount_cents" integer not null,
  "status" text default 'pending'::text not null,
  "expires_at" timestamp with time zone default (now() + '30 days'::interval) not null,
  "viewed_at" timestamp with time zone,
  "paid_at" timestamp with time zone,
  "square_payment_id" text,
  "created_at" timestamp with time zone default now(),
  "created_by" uuid,
  "location_id" uuid,
  "due_date" date,
  "billing_day" integer,
  "invoice_snapshot" jsonb,
  "sent_via" text,
  "sent_at" timestamp with time zone,
  "reminder_count" integer default 0,
  "last_reminder_at" timestamp with time zone,
  "billing_cycle_id" uuid,
  "base_amount_cents" integer,
  "adjustment_total_cents" integer default 0,
  "is_prorated" boolean default false,
  primary key ("id")
);

create table if not exists public."billing_periods" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "period_label" text not null,
  "billing_date" date not null,
  "status" text default 'pending'::text not null,
  "total_attempted" integer default 0,
  "total_succeeded" integer default 0,
  "total_failed" integer default 0,
  "total_revenue_cents" integer default 0,
  "created_at" timestamp with time zone default now(),
  primary key ("id")
);

create table if not exists public."billing_cycles" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "billing_month" date not null,
  "label" text not null,
  "status" text default 'open'::text not null,
  "auto_generated_at" timestamp with time zone,
  "locked_at" timestamp with time zone,
  "sent_at" timestamp with time zone,
  "total_base_cents" integer,
  "total_adjusted_cents" integer,
  "total_paid_cents" integer default 0,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  primary key ("id")
);

create table if not exists public."billing_events" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "family_id" uuid not null,
  "billing_period_id" uuid,
  "amount_cents" integer not null,
  "status" text default 'pending'::text not null,
  "square_payment_id" text,
  "failure_reason" text,
  "idempotency_key" text,
  "attempted_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone default now(),
  "student_id" uuid,
  "description" text,
  "due_date" date,
  "notes" text,
  primary key ("id")
);

create table if not exists public."billing_line_items" (
  "id" uuid default gen_random_uuid() not null,
  "billing_event_id" uuid not null,
  "student_id" uuid not null,
  "sessions_count" integer not null,
  "rate_per_session_cents" integer not null,
  "subtotal_cents" integer not null,
  "created_at" timestamp with time zone default now(),
  primary key ("id")
);

create table if not exists public."billing_adjustments" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "family_id" uuid not null,
  "student_id" uuid not null,
  "adjustment_type" text not null,
  "amount_cents" integer,
  "percent" numeric(5,2),
  "reason" text not null,
  "notes" text,
  "applies_to_cycle" date not null,
  "applied" boolean default false not null,
  "applied_at" timestamp with time zone,
  "applied_to_billing_event_id" uuid,
  "created_by" uuid,
  "created_at" timestamp with time zone default now(),
  "billing_cycle_id" uuid,
  "status" text default 'pending'::text,
  primary key ("id")
);

create table if not exists public."square_invoices" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "family_id" uuid,
  "square_invoice_id" text not null,
  "square_customer_id" text,
  "square_location_id" text,
  "status" text,
  "amount_cents" integer,
  "invoice_number" text,
  "title" text,
  "scheduled_at" timestamp with time zone,
  "due_date" date,
  "paid_at" timestamp with time zone,
  "square_created_at" timestamp with time zone,
  "synced_at" timestamp with time zone default now(),
  "raw_data" jsonb,
  "requested_amount" integer,
  "amount_paid" integer default 0,
  "invoice_date" date,
  "location_id" uuid,
  "recurring_series_id" text,
  "customer_email" text,
  "customer_name" text,
  "archived_at" timestamp with time zone,
  "metadata" jsonb default '{}'::jsonb,
  primary key ("id")
);

create table if not exists public."square_payments_fact" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "square_payment_id" text not null,
  "square_location_id" text,
  "location_id" uuid,
  "status" text not null,
  "source_type" text,
  "tender_bucket" text not null,
  "amount_money_cents" bigint,
  "tip_money_cents" bigint,
  "total_money_cents" bigint,
  "application_fee_money_cents" bigint,
  "processing_fee_total_cents" bigint default 0 not null,
  "refunded_money_cents" bigint,
  "net_total_cents" bigint,
  "reporting_date" date not null,
  "created_at_square" timestamp with time zone,
  "updated_at_square" timestamp with time zone,
  "raw_json" jsonb default '{}'::jsonb not null,
  "synced_at" timestamp with time zone default now() not null,
  "metadata" jsonb default '{}'::jsonb,
  primary key ("id")
);

create table if not exists public."square_refunds_fact" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "square_refund_id" text not null,
  "square_payment_id" text not null,
  "square_location_id" text,
  "location_id" uuid,
  "status" text,
  "amount_money_cents" bigint not null,
  "reporting_date" date not null,
  "created_at_square" timestamp with time zone,
  "updated_at_square" timestamp with time zone,
  "raw_json" jsonb default '{}'::jsonb not null,
  "synced_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."finance_accounts" (
  "id" uuid default gen_random_uuid() not null,
  "plaid_item_id" uuid not null,
  "plaid_account_id" text not null,
  "location_id" uuid,
  "account_name" text not null,
  "official_name" text,
  "mask" text,
  "account_type" text,
  "account_subtype" text,
  "institution_name" text,
  "is_active" boolean default true not null,
  "is_liquidity_account" boolean default true not null,
  "include_in_financials" boolean default true not null,
  "display_order" integer default 100 not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  primary key ("id")
);

create table if not exists public."finance_categories" (
  "id" uuid default gen_random_uuid() not null,
  "group_id" uuid,
  "key" text not null,
  "name" text not null,
  "description" text,
  "is_system" boolean default false not null,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  primary key ("id")
);

create table if not exists public."finance_category_groups" (
  "id" uuid default gen_random_uuid() not null,
  "key" text not null,
  "name" text not null,
  "direction" text,
  "display_order" integer default 100 not null,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  primary key ("id")
);

create table if not exists public."finance_category_rules" (
  "id" uuid default gen_random_uuid() not null,
  "category_id" uuid not null,
  "location_id" uuid,
  "account_id" uuid,
  "rule_type" text not null,
  "match_value" text,
  "match_value_2" text,
  "priority" integer default 100 not null,
  "applies_to_direction" text default 'any'::text,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  primary key ("id")
);

create table if not exists public."finance_locations" (
  "id" uuid default gen_random_uuid() not null,
  "code" text not null,
  "name" text not null,
  "location_type" text not null,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  "core_location_id" uuid,
  primary key ("id")
);

create table if not exists public."finance_plaid_items" (
  "id" uuid default gen_random_uuid() not null,
  "plaid_item_id" text not null,
  "institution_id" text,
  "institution_name" text,
  "status" text default 'active'::text not null,
  "transactions_cursor" text,
  "last_transactions_sync_at" timestamp with time zone,
  "last_balances_sync_at" timestamp with time zone,
  "last_webhook_at" timestamp with time zone,
  "error_code" text,
  "error_message" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  "access_token" text,
  primary key ("id")
);

create table if not exists public."finance_recurring_rules" (
  "id" uuid default gen_random_uuid() not null,
  "location_id" uuid,
  "account_id" uuid,
  "category_id" uuid,
  "name" text not null,
  "merchant_match" text,
  "transaction_name_match" text,
  "amount_hint" numeric(14,2),
  "cadence" text,
  "is_active" boolean default true not null,
  "notes" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  primary key ("id")
);

create table if not exists public."finance_sync_runs" (
  "id" uuid default gen_random_uuid() not null,
  "plaid_item_id" uuid,
  "sync_type" text not null,
  "status" text not null,
  "started_at" timestamp with time zone default now() not null,
  "completed_at" timestamp with time zone,
  "added_count" integer default 0 not null,
  "modified_count" integer default 0 not null,
  "removed_count" integer default 0 not null,
  "error_message" text,
  "metadata" jsonb default '{}'::jsonb not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  primary key ("id")
);

create table if not exists public."finance_transactions" (
  "id" uuid default gen_random_uuid() not null,
  "account_id" uuid not null,
  "location_id" uuid,
  "plaid_transaction_id" text,
  "pending_plaid_transaction_id" text,
  "external_reference" text,
  "posted_date" date,
  "authorized_date" date,
  "month_bucket" date,
  "transaction_name" text not null,
  "merchant_name" text,
  "amount" numeric(14,2) not null,
  "iso_currency_code" text default 'USD'::text,
  "unofficial_currency_code" text,
  "plaid_primary_category" text,
  "plaid_detailed_category" text,
  "payment_channel" text,
  "is_pending" boolean default false not null,
  "is_recurring" boolean default false not null,
  "is_transfer" boolean default false not null,
  "is_excluded" boolean default false not null,
  "notes" text,
  "raw_payload" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  primary key ("id")
);

create table if not exists public."finance_transaction_category_assignments" (
  "id" uuid default gen_random_uuid() not null,
  "transaction_id" uuid not null,
  "category_id" uuid,
  "assignment_source" text not null,
  "assigned_by" text,
  "confidence" numeric(5,2),
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  primary key ("id")
);

create table if not exists public."finance_balance_snapshots" (
  "id" uuid default gen_random_uuid() not null,
  "account_id" uuid not null,
  "snapshot_at" timestamp with time zone default now() not null,
  "available_balance" numeric(14,2),
  "current_balance" numeric(14,2),
  "iso_currency_code" text default 'USD'::text,
  "source" text default 'plaid'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  primary key ("id")
);

create table if not exists public."finance_exports" (
  "id" uuid default gen_random_uuid() not null,
  "requested_by" text,
  "location_id" uuid,
  "from_month" date,
  "to_month" date,
  "export_type" text not null,
  "status" text default 'pending'::text not null,
  "file_url" text,
  "created_at" timestamp with time zone default now() not null,
  "completed_at" timestamp with time zone,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  primary key ("id")
);

create table if not exists public."schedule_blocks" (
  "id" uuid default uuid_generate_v4() not null,
  "tenant_id" uuid not null,
  "location_id" uuid not null,
  "teacher_id" uuid not null,
  "student_id" uuid,
  "block_date" date not null,
  "start_time" time without time zone not null,
  "end_time" time without time zone not null,
  "status" block_status default 'available'::block_status not null,
  "is_recurring" boolean default false not null,
  "notes" text,
  "ai_context" jsonb default '{}'::jsonb,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "block_type" block_type default 'open_time'::block_type not null,
  "room" text,
  "fifth_week" boolean default false not null,
  "checked_in" boolean default false not null,
  "checked_in_at" timestamp with time zone,
  "checked_in_by" uuid,
  "callout_reason" text,
  "room_id" uuid,
  "teacher_tally" boolean default false,
  "generated_from_availability" boolean default false,
  "original_teacher_id" uuid,
  "original_teacher_name" text,
  "reminder_sent" boolean default false,
  "is_virtual" boolean default false not null,
  "meet_link" text,
  "meet_event_id" text,
  "converted_to_virtual_at" timestamp with time zone,
  "converted_by" uuid,
  "is_family_callout" boolean default false,
  "callout_id" uuid,
  "is_makeup_session" boolean default false,
  "makeup_session_id" uuid,
  "archived_at" timestamp with time zone,
  "metadata" jsonb default '{}'::jsonb,
  primary key ("id")
);

create table if not exists public."session_log" (
  "id" uuid default uuid_generate_v4() not null,
  "tenant_id" uuid not null,
  "schedule_block_id" uuid not null,
  "location_id" uuid not null,
  "teacher_id" uuid not null,
  "student_id" uuid not null,
  "block_date" date not null,
  "status" text default 'completed'::text not null,
  "teacher_rate" numeric(6,2) not null,
  "student_rate" numeric(6,2) not null,
  "lesson_notes" text,
  "ai_summary" text,
  "ai_context" jsonb default '{}'::jsonb,
  "created_at" timestamp with time zone default now() not null,
  "worked_on" text[] default '{}'::text[],
  "engagement_level" smallint,
  "progress_indicator" text,
  "voice_note_url" text,
  "teacher_note" text,
  "communication_id" uuid,
  "instrument" text,
  "parent_update_status" text default 'pending'::text,
  "payment_gated" boolean default false not null,
  "archived_at" timestamp with time zone,
  "notes" text,
  "service_quality" text,
  "metadata" jsonb default '{}'::jsonb,
  primary key ("id")
);

create table if not exists public."events" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "created_at" timestamp with time zone default now(),
  "actor_type" text,
  "actor_id" uuid,
  "event_type" text not null,
  "entity_type" text,
  "entity_id" uuid,
  "metadata" jsonb default '{}'::jsonb,
  primary key ("id")
);

create table if not exists public."tasks" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "task_type" text not null,
  "title" text not null,
  "description" text,
  "priority" text default 'normal'::text not null,
  "assigned_role" text,
  "assigned_to" uuid,
  "location_id" uuid,
  "created_by" uuid,
  "created_by_role" text,
  "entity_type" text,
  "entity_id" uuid,
  "entity_name" text,
  "status" text default 'pending'::text not null,
  "completed_at" timestamp with time zone,
  "completed_by" uuid,
  "completion_note" text,
  "dedup_key" text,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "file_verified" boolean,
  "escalated" boolean default false,
  "escalated_task_id" uuid,
  "snoozed_until" date,
  "recurring" text,
  "due_date" date,
  "archived_at" timestamp with time zone,
  "metadata" jsonb default '{}'::jsonb,
  primary key ("id")
);

create table if not exists public."notifications" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "profile_id" uuid not null,
  "type" text not null,
  "title" text not null,
  "body" text,
  "route" text,
  "reference_id" uuid,
  "reference_type" text,
  "read" boolean default false,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."pending_reminders" (
  "id" uuid default gen_random_uuid() not null,
  "block_id" uuid not null,
  "reminder_type" text not null,
  "fire_at" timestamp with time zone not null,
  "fired" boolean default false not null,
  "cancelled" boolean default false not null,
  "created_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."appointment_notifications" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "block_id" uuid not null,
  "event_type" text not null,
  "channel" text not null,
  "recipient_type" text not null,
  "recipient_name" text,
  "recipient_contact" text,
  "message_content" text not null,
  "sent_at" timestamp with time zone default now() not null,
  "success" boolean default true not null,
  "error_message" text,
  "created_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."studio_messages" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "family_id" uuid not null,
  "student_id" uuid,
  "location_id" uuid,
  "message_text" text not null,
  "direction" text not null,
  "sent_via" text default 'quo'::text not null,
  "quo_queued" boolean default true,
  "quo_delivered_at" timestamp with time zone,
  "to_phone" text,
  "from_phone" text,
  "sent_by_profile_id" uuid,
  "read" boolean default false,
  "read_at" timestamp with time zone,
  "read_by" uuid,
  "created_at" timestamp with time zone default now(),
  primary key ("id")
);

create table if not exists public."reviews" (
  "id" uuid default gen_random_uuid() not null,
  "reviewer_name" text not null,
  "location_name" text not null,
  "text_cleaned" text not null,
  "instrument_tag" text default 'general'::text not null,
  "is_active" boolean default true,
  "created_at" timestamp with time zone default now(),
  "tenant_id" uuid,
  "family_id" uuid,
  "student_id" uuid,
  "location_id" uuid,
  "rating" integer,
  "body" text,
  "parent_name" text,
  "student_name" text,
  "approved" boolean default false,
  "featured" boolean default false,
  "shareable" boolean default true,
  "prompted_by" text,
  "review_token" text,
  primary key ("id")
);

create table if not exists public."value_cards" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "student_id" uuid not null,
  "family_id" uuid,
  "location_id" uuid not null,
  "period_start" date not null,
  "period_end" date not null,
  "attendance_rate" numeric(5,2),
  "total_sessions_period" integer default 0 not null,
  "attended_sessions_period" integer default 0 not null,
  "total_sessions_lifetime" integer default 0 not null,
  "months_enrolled" integer default 0 not null,
  "percentile_rank" integer,
  "teacher_highlights" jsonb default '[]'::jsonb,
  "skills_worked_on" jsonb default '[]'::jsonb,
  "milestones" jsonb default '[]'::jsonb,
  "ai_summary" text,
  "instrument" text,
  "teacher_name" text,
  "sent_at" timestamp with time zone,
  "sent_via" text,
  "created_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."webhook_events" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  "integration_id" text not null,
  "direction" text not null,
  "event_type" text not null,
  "payload" jsonb default '{}'::jsonb not null,
  "status" text default 'pending'::text not null,
  "response_code" integer,
  "response_body" text,
  "error_message" text,
  "attempt_count" integer default 0 not null,
  "created_at" timestamp with time zone default now() not null,
  "latency_ms" integer,
  "delivery_id" text,
  "next_retry_at" timestamp with time zone,
  "target_url" text,
  primary key ("id")
);

create table if not exists public."integration_configs" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  "integration_id" text not null,
  "status" text default 'connected'::text not null,
  "enabled" boolean default true not null,
  "credentials" jsonb,
  "settings" jsonb default '{}'::jsonb not null,
  "connected_at" timestamp with time zone default now(),
  "connected_by" uuid,
  "updated_at" timestamp with time zone default now() not null,
  "last_health_check" timestamp with time zone,
  "health_status" text default 'unknown'::text,
  "health_message" text,
  "last_activity_at" timestamp with time zone,
  "webhook_url" text,
  "credentials_encrypted" text,
  primary key ("id")
);

create table if not exists public."integration_events" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "source" text not null,
  "event_type" text not null,
  "payload" jsonb default '{}'::jsonb not null,
  "matched" boolean default false,
  "matched_entity" text,
  "matched_entity_id" uuid,
  "error" text,
  "created_at" timestamp with time zone default now(),
  primary key ("id")
);

create table if not exists public."expenses" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "location_id" uuid,
  "category" text not null,
  "description" text,
  "amount_cents" integer not null,
  "is_recurring" boolean default true,
  "frequency" text default 'monthly'::text,
  "effective_date" date,
  "end_date" date,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."performance_alerts" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "alert_type" text not null,
  "severity" text not null,
  "message" text not null,
  "details" jsonb default '{}'::jsonb,
  "resolved" boolean default false,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "dedupe_key" text not null,
  "first_seen_at" timestamp with time zone not null,
  "last_seen_at" timestamp with time zone not null,
  "occurrence_count" integer default 1 not null,
  "worst_metric" numeric,
  "latest_metric" numeric,
  "resolution_reason" text,
  "regressed_at" timestamp with time zone,
  "muted_until" timestamp with time zone,
  "archived_at" timestamp with time zone,
  "status" text default 'open'::text,
  "metadata" jsonb default '{}'::jsonb,
  primary key ("id")
);

create table if not exists public."performance_metrics" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "session_id" text not null,
  "page_route" text not null,
  "load_time_ms" integer,
  "fcp_ms" integer,
  "lcp_ms" integer,
  "cls_score" numeric(6,4),
  "inp_ms" integer,
  "ttfb_ms" integer,
  "created_at" timestamp with time zone default now() not null,
  "archived_at" timestamp with time zone,
  "metadata" jsonb default '{}'::jsonb,
  primary key ("id")
);

create table if not exists public."audit_log" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "performed_by" uuid,
  "action" text not null,
  "table_name" text not null,
  "record_id" uuid,
  "old_value" jsonb,
  "new_value" jsonb,
  "reason" text,
  "created_at" timestamp with time zone default now(),
  "user_name" text,
  "user_role" text,
  "location_id" uuid,
  "entity_name" text,
  primary key ("id")
);

create table if not exists public."activity_log" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "user_id" uuid,
  "user_name" text,
  "action" text not null,
  "entity_type" text not null,
  "entity_id" uuid,
  "entity_name" text,
  "details" text,
  "created_at" timestamp with time zone default now() not null,
  "ip_address" text,
  "user_agent" text,
  "location_id" uuid,
  primary key ("id")
);

create table if not exists public."api_tokens" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
  "name" text not null,
  "token_hash" text not null,
  "token_prefix" text not null,
  "scopes" text[] default '{}'::text[] not null,
  "last_used_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "created_by" uuid,
  primary key ("id")
);

create table if not exists public."google_oauth_tokens" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "access_token" text not null,
  "refresh_token" text not null,
  "expires_at" timestamp with time zone not null,
  "connected_email" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."onboarding_sequences" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "student_id" uuid not null,
  "family_id" uuid,
  "location_id" uuid,
  "enrollment_date" date not null,
  "day_7_due" date,
  "day_7_completed_at" timestamp with time zone,
  "day_7_type" text,
  "day_14_due" date,
  "day_14_completed_at" timestamp with time zone,
  "day_14_type" text,
  "day_30_due" date,
  "day_30_completed_at" timestamp with time zone,
  "day_30_type" text,
  "day_60_due" date,
  "day_60_completed_at" timestamp with time zone,
  "day_60_type" text,
  "day_90_due" date,
  "day_90_completed_at" timestamp with time zone,
  "day_90_type" text,
  "status" text default 'active'::text not null,
  "risk_flag" boolean default false,
  "risk_reason" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."ai_workflows" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "name" text not null,
  "description" text,
  "enabled" boolean default true,
  "trigger_type" text not null,
  "trigger_config" jsonb not null,
  "action_type" text not null,
  "action_config" jsonb not null,
  "last_run_at" timestamp with time zone,
  "run_count" integer default 0,
  "last_result" jsonb,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."ai_conversations" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "profile_id" uuid not null,
  "source" text default 'ziro_unknown'::text not null,
  "client_route" text,
  "page_context" jsonb default '{}'::jsonb not null,
  "metadata" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."ai_messages" (
  "id" uuid default gen_random_uuid() not null,
  "conversation_id" uuid not null,
  "tenant_id" uuid not null,
  "profile_id" uuid not null,
  "role" text not null,
  "content" text,
  "error_text" text,
  "metadata" jsonb default '{}'::jsonb not null,
  "model" text,
  "usage" jsonb,
  "seq" integer default 0 not null,
  "created_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."ai_action_logs" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "profile_id" uuid not null,
  "conversation_id" uuid,
  "action_id" text not null,
  "payload" jsonb,
  "result" jsonb,
  "ok" boolean not null,
  "error_code" text,
  "error_message" text,
  "idempotency_key" text,
  "created_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."ai_feedback" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "profile_id" uuid not null,
  "conversation_id" uuid,
  "message_id" uuid,
  "rating" smallint,
  "comment" text,
  "created_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."ai_legacy_message_log" (
  "id" uuid default uuid_generate_v4() not null,
  "tenant_id" uuid not null,
  "profile_id" uuid not null,
  "role" text not null,
  "content" text not null,
  "metadata" jsonb default '{}'::jsonb,
  "created_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."ziro_skills" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "key" text not null,
  "name" text not null,
  "description" text,
  "business_context" text,
  "runtime" text default 'edge_function'::text not null,
  "allowed_tools" text[] default '{}'::text[] not null,
  "system_prompt_fragment" text,
  "risk_tier" text default 'low'::text not null,
  "cost_tier" text default 'free'::text not null,
  "is_active" boolean default false not null,
  "is_system" boolean default false not null,
  "created_by" uuid,
  "approved_by" uuid,
  "approved_at" timestamp with time zone,
  "last_used_at" timestamp with time zone,
  "use_count" integer default 0 not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."ziro_agents" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "name" text not null,
  "purpose" text,
  "status" text default 'active'::text not null,
  "owner_type" text default 'system'::text not null,
  "lifecycle_type" text default 'temporary'::text not null,
  "invocation_rules" jsonb default '{}'::jsonb not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "last_used_at" timestamp with time zone,
  "retired_at" timestamp with time zone,
  "role" text,
  "instructions" text,
  "usage_triggers" jsonb default '[]'::jsonb not null,
  "auto_use_by_ziro" boolean default true not null,
  "profile_summary" text,
  "updated_at" timestamp with time zone default now() not null,
  "is_visible_in_ui" boolean default true not null,
  "is_archived" boolean default false not null,
  "business_context" text default 'music_school'::text not null,
  primary key ("id")
);

create table if not exists public."ziro_agent_skills" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "agent_id" uuid not null,
  "skill_id" uuid not null,
  "is_primary" boolean default false not null,
  "attached_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."ziro_config" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "instructions" text,
  "routing_rules" jsonb default '{}'::jsonb not null,
  "default_skill_ids" uuid[] default '{}'::uuid[] not null,
  "delegation_rules" jsonb default '[]'::jsonb not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  primary key ("id")
);

create table if not exists public."ziro_idempotency_keys" (
  "tenant_id" uuid not null,
  "action_type" text not null,
  "idempotency_key" text not null,
  "profile_id" uuid not null,
  "result" jsonb not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."ziro_page_intelligence_bindings" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "page_key" text not null,
  "primary_agent_id" uuid,
  "updated_at" timestamp with time zone default now() not null,
  "supporting_agent_ids" uuid[] default '{}'::uuid[] not null,
  primary key ("id")
);

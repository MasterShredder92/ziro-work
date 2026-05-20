-- Phase 4 Wave 3: Final Sweep — All Remaining Tenant Tables
-- 67 tables: 23 TEXT tenant_id + 44 UUID tenant_id
-- Pattern: tenant_isolation FOR ALL TO authenticated
-- TEXT:  USING (tenant_id = current_setting('app.tenant_id'::text, true))
-- UUID:  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid)
-- Skipped (views): v_family_billing, view_family_account_summary, view_schedule_blocks_extended,
--   view_student_lifecycle_context, view_student_profiles, view_tenant_billing_aging, vw_student_family_search
-- Skipped (no tenant_id — global/system): anchor_job_locks, bank_accounts, bank_statements,
--   bank_transactions, billing_line_items, contacts, customers, lesson_notes, location_hours,
--   metric_snapshots, pending_reminders, portal_activity, profile_locations, raven_knowledge_base,
--   settings, star_reviews, system_health, teacher_locations, touches, vault_delivery_attempts,
--   vault_fulfillment_events, vault_product_square_map, verticals
-- Skipped (already hardened Waves 1–2): all financial tables, notes, activity_log,
--   recurring_lessons, session_log, tenants + 5 tables with tenant_access policy
-- Skipped (vault — user_id isolation, not tenant): vault_users, vault_products,
--   vault_product_modules, vault_user_products, vault_user_module_progress

-- =====================================================================
-- TEXT TENANT_ID TABLES (23)
-- =====================================================================

CREATE POLICY tenant_isolation ON public.addresses
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.api_tokens
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.attendance
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.brand_settings
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.enrollments
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.error_resolution_logs
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.expenses
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.finance_accounts
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.finance_locations
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.integration_configs
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.leads
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.lesson_plans
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.lifecycle
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.performance_alerts
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.pricing_tiers
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.raven_escalations
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.raven_message_log
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.schedules
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.student_followups
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.teacher_w9
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.tenant_settings
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.trials
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY tenant_isolation ON public.ziro_events
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true));

-- =====================================================================
-- UUID TENANT_ID TABLES (44)
-- =====================================================================

CREATE POLICY tenant_isolation ON public.agent_tenants
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.appointment_notifications
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.audit_log
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.events
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.family_files
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.files
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.finance_balance_snapshots
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.finance_categories
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.finance_category_groups
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.finance_category_rules
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.finance_exports
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.finance_plaid_items
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.finance_recurring_rules
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.finance_sync_runs
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.finance_transaction_category_assignments
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.finance_transactions
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.google_oauth_tokens
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.intake_submissions
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.integration_events
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.issues
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.notifications
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.onboarding_sequences
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.performance_metrics
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.permission_definitions
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.privacy_violation_log
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.rate_limit_hits
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.recruitment_prospects
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.reviews
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.room_inventory
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.rooms
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.schedule_series
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.security_events
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.sid_context_cache
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.stewie_risk_log
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.student_duplicate_reviews
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.student_events
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.student_files
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.student_instruments
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.student_notes
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.studio_closures
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.studio_messages
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.teacher_availability
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.teacher_room_assignments
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.tenant_agent_config
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY tenant_isolation ON public.value_cards
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

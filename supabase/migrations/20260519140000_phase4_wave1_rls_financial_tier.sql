-- Phase 4 Wave 1: Financial Tier RLS Hardening
-- Matches the established tenant_isolation pattern used on lessons, agreements, portalsessions.
-- Session variable: current_setting('app.tenant_id', true) — returns NULL when not set,
-- which causes tenant_id = NULL to be false, safely blocking unauthenticated access.
-- service_role bypasses RLS via rolbypassrls=true — no policy needed for it.
-- Mixed tenant_id types: text tables compare directly; uuid tables cast the setting ::uuid.

-- ─── Drop redundant pre-existing policy ────────────────────────────────────────
-- service_role already bypasses RLS via rolbypassrls=true; this policy is dead weight.

DROP POLICY IF EXISTS "service_role_all_invoice_items" ON public.invoice_items;

-- ─── TEXT tenant_id tables (15) ────────────────────────────────────────────────

CREATE POLICY "tenant_isolation" ON public.payments
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.invoices
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.invoice_line_items
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.billing_cycles
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.billing_plans
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.billing_settings
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.credits
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.discounts
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.subscriptions
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.subscription_items
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.usage_records
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.square_invoices
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.square_invoices_fact
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.square_payments_fact
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

CREATE POLICY "tenant_isolation" ON public.stripe_customers
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true));

-- ─── UUID tenant_id tables (7) ─────────────────────────────────────────────────
-- current_setting returns text; cast to uuid for type-safe comparison.
-- NULL::uuid is still NULL, so unset session variable safely blocks access.

CREATE POLICY "tenant_isolation" ON public.billing_adjustments
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY "tenant_isolation" ON public.billing_events
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY "tenant_isolation" ON public.billing_periods
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY "tenant_isolation" ON public.invoice_flags
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY "tenant_isolation" ON public.invoice_items
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY "tenant_isolation" ON public.invoice_tokens
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

CREATE POLICY "tenant_isolation" ON public.square_refunds_fact
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.tenant_id'::text, true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id'::text, true)::uuid);

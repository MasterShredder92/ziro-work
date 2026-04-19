import "server-only";
import {
  createSubscription as dataCreateSubscription,
  getSubscriptionById,
  listSubscriptions as dataListSubscriptions,
  updateSubscription as dataUpdateSubscription,
  type SubscriptionFilter,
  type SubscriptionInsert,
  type SubscriptionRow,
  type SubscriptionUpdate,
} from "@data/subscriptions";
import {
  getBillingPlanById,
  type BillingPlanRow,
} from "@data/billingPlans";
import type { InvoiceLineItemInsert } from "@data/invoiceLineItems";
import { createInvoice as createInvoiceService } from "./invoiceQueries";
import type { InvoiceWithLines } from "./models";
import type { ListOptions } from "@data/_client";

function addInterval(
  from: Date,
  interval: string,
  count: number,
): Date {
  const d = new Date(from.getTime());
  const n = Math.max(1, count || 1);
  switch (interval) {
    case "week":
      d.setDate(d.getDate() + 7 * n);
      return d;
    case "quarter":
      d.setMonth(d.getMonth() + 3 * n);
      return d;
    case "year":
      d.setFullYear(d.getFullYear() + n);
      return d;
    case "month":
    default:
      d.setMonth(d.getMonth() + n);
      return d;
  }
}

export async function listSubscriptions(
  tenantId: string,
  filter?: SubscriptionFilter,
  opts?: ListOptions,
): Promise<SubscriptionRow[]> {
  return dataListSubscriptions(tenantId, filter, opts);
}

export async function getSubscription(
  tenantId: string,
  id: string,
): Promise<SubscriptionRow | null> {
  return getSubscriptionById(id, tenantId);
}

export async function createSubscription(
  tenantId: string,
  input: SubscriptionInsert,
): Promise<SubscriptionRow> {
  const start =
    input.start_date ?? new Date().toISOString().slice(0, 10);
  const plan = input.billing_plan_id
    ? await getBillingPlanById(input.billing_plan_id, tenantId)
    : null;
  const periodStart = new Date(start);
  const periodEnd = plan
    ? addInterval(periodStart, plan.interval, plan.interval_count)
    : addInterval(periodStart, "month", 1);
  return dataCreateSubscription(tenantId, {
    ...input,
    start_date: start,
    current_period_start: periodStart.toISOString().slice(0, 10),
    current_period_end: periodEnd.toISOString().slice(0, 10),
    next_invoice_at: periodStart.toISOString(),
  });
}

export async function updateSubscription(
  tenantId: string,
  id: string,
  patch: SubscriptionUpdate,
): Promise<SubscriptionRow> {
  return dataUpdateSubscription(id, tenantId, patch);
}

export async function cancelSubscription(
  tenantId: string,
  id: string,
  reason?: string,
  cancelAt?: string,
): Promise<SubscriptionRow> {
  const now = new Date().toISOString();
  return dataUpdateSubscription(id, tenantId, {
    status: "cancelled",
    cancelled_at: now,
    cancel_at: cancelAt ?? now,
    cancel_reason: reason ?? null,
  });
}

export type GeneratedInvoiceResult = {
  subscriptionId: string;
  invoice: InvoiceWithLines;
};

export async function generateRecurringInvoices(
  tenantId: string,
  opts?: { now?: Date; limit?: number },
): Promise<GeneratedInvoiceResult[]> {
  const now = opts?.now ?? new Date();
  const horizon = now.toISOString();
  const candidates = await dataListSubscriptions(
    tenantId,
    { status: "active", due_before: horizon },
    { limit: opts?.limit ?? 100, orderBy: "next_invoice_at", ascending: true },
  );

  const results: GeneratedInvoiceResult[] = [];
  for (const sub of candidates) {
    if (!sub.next_invoice_at) continue;
    const plan = sub.billing_plan_id
      ? await getBillingPlanById(sub.billing_plan_id, tenantId)
      : null;
    if (!plan) continue;

    const invoice = await invoiceForPlan(tenantId, sub, plan);
    const periodStart = sub.current_period_end
      ? new Date(sub.current_period_end)
      : new Date(sub.start_date);
    const periodEnd = addInterval(periodStart, plan.interval, plan.interval_count);
    await dataUpdateSubscription(sub.id, tenantId, {
      current_period_start: periodStart.toISOString().slice(0, 10),
      current_period_end: periodEnd.toISOString().slice(0, 10),
      next_invoice_at: periodEnd.toISOString(),
    });
    results.push({ subscriptionId: sub.id, invoice });
  }
  return results;
}

async function invoiceForPlan(
  tenantId: string,
  sub: SubscriptionRow,
  plan: BillingPlanRow,
): Promise<InvoiceWithLines> {
  const qty = sub.quantity ?? 1;
  const lineItems: InvoiceLineItemInsert[] = [];
  const base = sub.price_override_cents ?? plan.base_price_cents ?? 0;

  switch (plan.kind) {
    case "hourly":
      lineItems.push({
        invoice_id: "",
        description: `${plan.name} — ${plan.unit_label ?? "hour"}`,
        quantity: qty,
        unit_amount_cents: plan.per_unit_price_cents ?? base,
        amount_cents: Math.round((plan.per_unit_price_cents ?? base) * qty),
        taxable: plan.tax_rate_bp > 0,
        kind: "session",
      });
      break;
    case "per_lesson":
      lineItems.push({
        invoice_id: "",
        description: `${plan.name} — lesson`,
        quantity: qty,
        unit_amount_cents: plan.per_unit_price_cents ?? base,
        amount_cents: Math.round((plan.per_unit_price_cents ?? base) * qty),
        taxable: plan.tax_rate_bp > 0,
        kind: "session",
      });
      break;
    case "hybrid":
      lineItems.push({
        invoice_id: "",
        description: `${plan.name} — base`,
        quantity: 1,
        unit_amount_cents: base,
        amount_cents: base,
        taxable: plan.tax_rate_bp > 0,
      });
      if (plan.per_unit_price_cents && qty > (plan.included_units ?? 0)) {
        const overage = qty - (plan.included_units ?? 0);
        lineItems.push({
          invoice_id: "",
          description: `${plan.name} — ${plan.unit_label ?? "unit"} overage`,
          quantity: overage,
          unit_amount_cents: plan.per_unit_price_cents,
          amount_cents: Math.round(plan.per_unit_price_cents * overage),
          taxable: plan.tax_rate_bp > 0,
        });
      }
      break;
    case "fixed":
    default:
      lineItems.push({
        invoice_id: "",
        description: plan.name,
        quantity: 1,
        unit_amount_cents: base,
        amount_cents: base,
        taxable: plan.tax_rate_bp > 0,
      });
      break;
  }

  return createInvoiceService(tenantId, {
    family_id: sub.family_id,
    student_id: sub.student_id,
    subscription_id: sub.id,
    billing_plan_id: plan.id,
    currency: plan.currency,
    lineItems,
    status: "open",
  });
}

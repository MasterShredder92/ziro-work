import "server-only";
import {
  getPlanById,
  listPlans as listPlansData,
  type PlanRow,
} from "@data/plans";
import {
  createSubscription as createSubscriptionData,
  listSubscriptions as listSubscriptionsData,
  updateSubscription as updateSubscriptionData,
  type SubscriptionRow,
} from "@data/subscriptions";
import {
  listUsageRecords,
  recordUsage as recordUsageData,
} from "@data/usageRecords";
import {
  listInvoices as listInvoicesData,
  updateInvoice,
  type InvoiceRow,
} from "@data/invoices";
import { createInvoice as createInvoiceService } from "@/lib/billing/invoiceQueries";
import type {
  BillingPeriod,
  Invoice,
  Plan,
  Subscription,
  UsageRecord,
} from "@/lib/billing/types";
import {
  ensureStripeCustomer,
  syncStripeInvoice,
  syncStripeSubscription,
} from "@/lib/billing/stripe";

function toPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    priceMonthly: row.price_monthly,
    priceYearly: row.price_yearly,
    limits: row.limits ?? {},
    active: row.is_active,
    billingPlanId: row.billing_plan_id,
  };
}

function toSubscription(row: SubscriptionRow): Subscription {
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    planId: (metadata.plan_id as string | null) ?? null,
    status: row.status,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    stripeCustomerId: (metadata.stripe_customer_id as string | null) ?? null,
    stripeSubscriptionId: (metadata.stripe_subscription_id as string | null) ?? null,
    metadata,
  };
}

function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    amount: row.amount_cents ?? row.total_cents ?? 0,
    status: row.status,
    periodStart:
      (row.metadata as { period_start?: string | null } | null)?.period_start ?? null,
    periodEnd:
      (row.metadata as { period_end?: string | null } | null)?.period_end ?? null,
    lineItems:
      (row.metadata as { line_items?: Array<Record<string, unknown>> } | null)
        ?.line_items ?? [],
    stripeInvoiceId:
      (row.metadata as { stripe_invoice_id?: string | null } | null)
        ?.stripe_invoice_id ?? null,
  };
}

export async function listPlans(tenantId: string): Promise<Plan[]> {
  const rows = await listPlansData(tenantId, { activeOnly: true, limit: 100 });
  return rows.map(toPlan);
}

export async function getPlan(
  tenantId: string,
  planId: string,
): Promise<Plan | null> {
  const row = await getPlanById(tenantId, planId);
  return row ? toPlan(row) : null;
}

export async function createSubscription(input: {
  tenantId: string;
  planId: string;
  billingCycle?: "monthly" | "yearly";
  familyId?: string | null;
  studentId?: string | null;
}): Promise<Subscription> {
  const plan = await getPlan(input.tenantId, input.planId);
  if (!plan) throw new Error("PLAN_NOT_FOUND");
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + (input.billingCycle === "yearly" ? 12 : 1));

  const stripeCustomer = await ensureStripeCustomer(input.tenantId);
  const row = await createSubscriptionData(input.tenantId, {
    plan_id: input.planId,
    billing_plan_id: plan.billingPlanId ?? null,
    family_id: input.familyId ?? null,
    student_id: input.studentId ?? null,
    status: "active",
    start_date: now.toISOString().slice(0, 10),
    current_period_start: now.toISOString().slice(0, 10),
    current_period_end: periodEnd.toISOString().slice(0, 10),
    next_invoice_at: periodEnd.toISOString(),
    metadata: {
      plan_id: plan.id,
      billing_cycle: input.billingCycle ?? "monthly",
      stripe_customer_id: stripeCustomer?.id ?? null,
    },
  });

  const sub = toSubscription(row);
  await syncStripeSubscription({
    tenantId: input.tenantId,
    subscriptionId: row.id,
    customerId: stripeCustomer?.id ?? null,
    plan,
    billingCycle: input.billingCycle ?? "monthly",
  }).catch(() => null);

  return sub;
}

export async function updateSubscription(input: {
  tenantId: string;
  subscriptionId: string;
  status?: string;
  planId?: string | null;
}): Promise<Subscription> {
  const patch: Partial<SubscriptionRow> = {};
  if (input.status) patch.status = input.status;
  if (input.planId !== undefined) {
    patch.metadata = { plan_id: input.planId };
  }
  const row = await updateSubscriptionData(input.subscriptionId, input.tenantId, patch);
  const next = toSubscription(row);
  await syncStripeSubscription({
    tenantId: input.tenantId,
    subscriptionId: row.id,
    customerId: next.stripeCustomerId ?? null,
    plan:
      input.planId ? await getPlan(input.tenantId, input.planId) : null,
    status: row.status,
  }).catch(() => null);
  return next;
}

export async function listTenantSubscriptions(
  tenantId: string,
): Promise<Subscription[]> {
  const rows = await listSubscriptionsData(tenantId, undefined, { limit: 200 });
  return rows.map(toSubscription);
}

export async function recordUsage(input: {
  tenantId: string;
  metric: string;
  amount: number;
  source?: string;
  metadata?: Record<string, unknown>;
}): Promise<UsageRecord> {
  const row = await recordUsageData(input.tenantId, {
    metric: input.metric,
    amount: input.amount,
    source: input.source ?? "system",
    metadata: input.metadata ?? {},
    timestamp: new Date().toISOString(),
  });
  return {
    id: row.id,
    tenantId: row.tenant_id,
    metric: row.metric,
    amount: Number(row.amount),
    timestamp: row.timestamp,
    source: row.source,
    metadata: row.metadata,
  };
}

function lineItemsFromUsage(
  usage: Awaited<ReturnType<typeof listUsageRecords>>,
): Array<{ description: string; quantity: number; amount_cents: number }> {
  return usage.map((r) => {
    const qty = Number(r.amount);
    const cents = r.metric === "storage" ? Math.round(qty / (1024 * 1024)) : qty;
    return {
      description: `${r.metric} usage`,
      quantity: qty,
      amount_cents: Math.max(0, cents),
    };
  });
}

export async function generateInvoice(input: {
  tenantId: string;
  period: BillingPeriod;
  subscriptionId?: string;
  familyId?: string | null;
  studentId?: string | null;
}): Promise<Invoice> {
  const usage = await listUsageRecords(
    input.tenantId,
    { from: input.period.start, to: input.period.end },
    { limit: 5000 },
  );
  const lineItems = lineItemsFromUsage(usage);
  const invoice = await createInvoiceService(input.tenantId, {
    subscription_id: input.subscriptionId ?? null,
    family_id: input.familyId ?? null,
    student_id: input.studentId ?? null,
    status: "open",
    lineItems: lineItems.map((li, i) => ({
      invoice_id: "",
      description: li.description,
      quantity: li.quantity,
      amount_cents: li.amount_cents,
      unit_amount_cents: li.quantity > 0 ? Math.round(li.amount_cents / li.quantity) : 0,
      sort_order: i,
    })),
    metadata: {
      period_start: input.period.start,
      period_end: input.period.end,
      line_items: lineItems,
    },
  });

  await updateInvoice(invoice.id, input.tenantId, {
    metadata: {
      ...(invoice.metadata ?? {}),
      period_start: input.period.start,
      period_end: input.period.end,
      line_items: lineItems,
    },
  });

  await syncStripeInvoice({
    tenantId: input.tenantId,
    invoiceId: invoice.id,
    amountCents: invoice.total_cents ?? invoice.amount_cents ?? 0,
  }).catch(() => null);

  return {
    id: invoice.id,
    tenantId: invoice.tenant_id,
    amount: invoice.total_cents ?? invoice.amount_cents ?? 0,
    status: invoice.status,
    periodStart: input.period.start,
    periodEnd: input.period.end,
    lineItems: lineItems as Array<Record<string, unknown>>,
  };
}

export async function listInvoices(tenantId: string): Promise<Invoice[]> {
  const rows = await listInvoicesData(tenantId, undefined, { limit: 200 });
  return rows.map(toInvoice);
}

export async function getUsageBreakdown(
  tenantId: string,
  period: BillingPeriod,
): Promise<Array<{ metric: string; total: number }>> {
  const rows = await listUsageRecords(
    tenantId,
    { from: period.start, to: period.end },
    { limit: 5000 },
  );
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.metric, (map.get(row.metric) ?? 0) + Number(row.amount));
  }
  return Array.from(map.entries())
    .map(([metric, total]) => ({ metric, total }))
    .sort((a, b) => b.total - a.total);
}

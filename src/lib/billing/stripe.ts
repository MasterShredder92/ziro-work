import "server-only";
import Stripe from "stripe";
import { serviceClient } from "@data/_client";
import { getTenant } from "@data/tenants";
import type { Plan } from "@/lib/billing/types";
// automation removed — stub
async function dispatchBillingTrigger(_tenantId: string, _event: string, _payload?: unknown): Promise<void> { /* no-op until agents are rebuilt */ }

type StripeSyncSubscriptionInput = {
  tenantId: string;
  subscriptionId: string;
  customerId?: string | null;
  plan?: Plan | null;
  billingCycle?: "monthly" | "yearly";
  status?: string;
};

type StripeSyncInvoiceInput = {
  tenantId: string;
  invoiceId: string;
  amountCents: number;
};

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

export async function ensureStripeCustomer(
  tenantId: string,
): Promise<Stripe.Customer | null> {
  const stripe = stripeClient();
  if (!stripe) return null;
  const tenant = await getTenant(tenantId).catch(() => null);
  const name = tenant?.name ?? `Tenant ${tenantId.slice(0, 8)}`;

  const existing = await stripe.customers
    .search({
      query: `metadata['tenant_id']:'${tenantId}'`,
      limit: 1,
    })
    .catch(() => ({ data: [] as Stripe.Customer[] }));

  if (existing.data.length > 0) return existing.data[0] ?? null;
  return stripe.customers.create({
    name,
    metadata: { tenant_id: tenantId },
  });
}

export async function syncStripeSubscription(
  input: StripeSyncSubscriptionInput,
): Promise<string | null> {
  const stripe = stripeClient();
  if (!stripe) return null;
  const customerId = input.customerId ?? (await ensureStripeCustomer(input.tenantId))?.id;
  if (!customerId) return null;

  if (!input.plan) return null;
  const amount =
    input.billingCycle === "yearly"
      ? input.plan.priceYearly
      : input.plan.priceMonthly;
  const interval: "month" | "year" =
    input.billingCycle === "yearly" ? "year" : "month";

  const product = await stripe.products.create({
    name: input.plan.name,
    metadata: {
      tenant_id: input.tenantId,
      plan_id: input.plan.id,
    },
  });
  const price = await stripe.prices.create({
    currency: "usd",
    unit_amount: Math.max(0, amount),
    recurring: { interval },
    product: product.id,
    metadata: {
      tenant_id: input.tenantId,
      plan_id: input.plan.id,
    },
  });
  const stripeSub = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    metadata: {
      tenant_id: input.tenantId,
      subscription_id: input.subscriptionId,
    },
  });

  const supabase = serviceClient();
  await supabase
    .from("subscriptions")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSub.id,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.subscriptionId);

  return stripeSub.id;
}

export async function syncStripeInvoice(
  input: StripeSyncInvoiceInput,
): Promise<string | null> {
  const stripe = stripeClient();
  if (!stripe) return null;
  const customer = await ensureStripeCustomer(input.tenantId);
  if (!customer) return null;

  await stripe.invoiceItems.create({
    customer: customer.id,
    amount: Math.max(0, Math.round(input.amountCents)),
    currency: "usd",
    description: `Invoice ${input.invoiceId}`,
    metadata: {
      tenant_id: input.tenantId,
      invoice_id: input.invoiceId,
    },
  });
  const stripeInvoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: "send_invoice",
    metadata: {
      tenant_id: input.tenantId,
      invoice_id: input.invoiceId,
    },
  });

  const supabase = serviceClient();
  await supabase
    .from("invoices")
    .update({
      stripe_invoice_id: stripeInvoice.id,
      metadata: {
        stripe_invoice_id: stripeInvoice.id,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.invoiceId);

  return stripeInvoice.id;
}

async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const tenantId = invoice.metadata?.tenant_id;
  const invoiceId = invoice.metadata?.invoice_id;
  if (!tenantId || !invoiceId) return;
  const supabase = serviceClient();
  await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", invoiceId);
  await dispatchBillingTrigger(tenantId, "billing.invoice.paid", {
    invoiceId,
    stripeInvoiceId: invoice.id,
    amountPaid: invoice.amount_paid,
    customerId: invoice.customer,
  }).catch(() => null);
}

async function handleInvoiceFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const tenantId = invoice.metadata?.tenant_id;
  const invoiceId = invoice.metadata?.invoice_id;
  if (!tenantId || !invoiceId) return;
  const supabase = serviceClient();
  await supabase
    .from("invoices")
    .update({
      status: "overdue",
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", invoiceId);
  await dispatchBillingTrigger(tenantId, "billing.invoice.failed", {
    invoiceId,
    stripeInvoiceId: invoice.id,
    attemptCount: invoice.attempt_count,
    customerId: invoice.customer,
  }).catch(() => null);
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const stripeSub = event.data.object as Stripe.Subscription;
  const stripeSubRaw = stripeSub as Stripe.Subscription & {
    current_period_start?: number | null;
    current_period_end?: number | null;
  };
  const tenantId = stripeSub.metadata?.tenant_id;
  const subscriptionId = stripeSub.metadata?.subscription_id;
  if (!tenantId || !subscriptionId) return;
  const supabase = serviceClient();
  await supabase
    .from("subscriptions")
    .update({
      status: stripeSub.status,
      current_period_start: stripeSubRaw.current_period_start
        ? new Date(stripeSubRaw.current_period_start * 1000).toISOString().slice(0, 10)
        : null,
      current_period_end: stripeSubRaw.current_period_end
        ? new Date(stripeSubRaw.current_period_end * 1000).toISOString().slice(0, 10)
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", subscriptionId);
  await dispatchBillingTrigger(tenantId, "billing.subscription.updated", {
    subscriptionId,
    stripeSubscriptionId: stripeSub.id,
    status: stripeSub.status,
    currentPeriodStart: stripeSubRaw.current_period_start,
    currentPeriodEnd: stripeSubRaw.current_period_end,
    customerId: stripeSub.customer,
  }).catch(() => null);
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "invoice.paid":
      await handleInvoicePaid(event);
      return;
    case "invoice.payment_failed":
      await handleInvoiceFailed(event);
      return;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event);
      return;
    default:
      return;
  }
}

export function verifyStripeWebhook(payload: string, signature: string): Stripe.Event {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) throw new Error("STRIPE_NOT_CONFIGURED");
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

import "server-only";
import Stripe from "stripe";
import { clientFor } from "@data/_client";
import { getTenant } from "@data/tenants";
import { dispatchBillingTrigger } from "@/lib/automation/workflows/triggers";
function stripeClient() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key)
        return null;
    return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}
export async function ensureStripeCustomer(tenantId) {
    var _a, _b;
    const stripe = stripeClient();
    if (!stripe)
        return null;
    const tenant = await getTenant(tenantId).catch(() => null);
    const name = (_a = tenant === null || tenant === void 0 ? void 0 : tenant.name) !== null && _a !== void 0 ? _a : `Tenant ${tenantId.slice(0, 8)}`;
    const existing = await stripe.customers
        .search({
        query: `metadata['tenant_id']:'${tenantId}'`,
        limit: 1,
    })
        .catch(() => ({ data: [] }));
    if (existing.data.length > 0)
        return (_b = existing.data[0]) !== null && _b !== void 0 ? _b : null;
    return stripe.customers.create({
        name,
        metadata: { tenant_id: tenantId },
    });
}
export async function syncStripeSubscription(input) {
    var _a, _b;
    const stripe = stripeClient();
    if (!stripe)
        return null;
    const customerId = (_a = input.customerId) !== null && _a !== void 0 ? _a : (_b = (await ensureStripeCustomer(input.tenantId))) === null || _b === void 0 ? void 0 : _b.id;
    if (!customerId)
        return null;
    if (!input.plan)
        return null;
    const amount = input.billingCycle === "yearly"
        ? input.plan.priceYearly
        : input.plan.priceMonthly;
    const interval = input.billingCycle === "yearly" ? "year" : "month";
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
    const supabase = clientFor(input.tenantId);
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
export async function syncStripeInvoice(input) {
    const stripe = stripeClient();
    if (!stripe)
        return null;
    const customer = await ensureStripeCustomer(input.tenantId);
    if (!customer)
        return null;
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
    const supabase = clientFor(input.tenantId);
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
async function handleInvoicePaid(event) {
    var _a, _b;
    const invoice = event.data.object;
    const tenantId = (_a = invoice.metadata) === null || _a === void 0 ? void 0 : _a.tenant_id;
    const invoiceId = (_b = invoice.metadata) === null || _b === void 0 ? void 0 : _b.invoice_id;
    if (!tenantId || !invoiceId)
        return;
    const supabase = clientFor(tenantId);
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
async function handleInvoiceFailed(event) {
    var _a, _b;
    const invoice = event.data.object;
    const tenantId = (_a = invoice.metadata) === null || _a === void 0 ? void 0 : _a.tenant_id;
    const invoiceId = (_b = invoice.metadata) === null || _b === void 0 ? void 0 : _b.invoice_id;
    if (!tenantId || !invoiceId)
        return;
    const supabase = clientFor(tenantId);
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
async function handleSubscriptionUpdated(event) {
    var _a, _b;
    const stripeSub = event.data.object;
    const stripeSubRaw = stripeSub;
    const tenantId = (_a = stripeSub.metadata) === null || _a === void 0 ? void 0 : _a.tenant_id;
    const subscriptionId = (_b = stripeSub.metadata) === null || _b === void 0 ? void 0 : _b.subscription_id;
    if (!tenantId || !subscriptionId)
        return;
    const supabase = clientFor(tenantId);
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
export async function handleStripeWebhookEvent(event) {
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
export function verifyStripeWebhook(payload, signature) {
    const stripe = stripeClient();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret)
        throw new Error("STRIPE_NOT_CONFIGURED");
    return stripe.webhooks.constructEvent(payload, signature, secret);
}

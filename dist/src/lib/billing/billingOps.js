import "server-only";
import { getPlanById, listPlans as listPlansData, } from "@data/plans";
import { createSubscription as createSubscriptionData, listSubscriptions as listSubscriptionsData, updateSubscription as updateSubscriptionData, } from "@data/subscriptions";
import { listUsageRecords, recordUsage as recordUsageData, } from "@data/usageRecords";
import { listInvoices as listInvoicesData, updateInvoice, } from "@data/invoices";
import { createInvoice as createInvoiceService } from "@/lib/billing/invoiceQueries";
import { ensureStripeCustomer, syncStripeInvoice, syncStripeSubscription, } from "@/lib/billing/stripe";
function toPlan(row) {
    var _a;
    return {
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        priceMonthly: row.price_monthly,
        priceYearly: row.price_yearly,
        limits: (_a = row.limits) !== null && _a !== void 0 ? _a : {},
        active: row.is_active,
        billingPlanId: row.billing_plan_id,
    };
}
function toSubscription(row) {
    var _a, _b, _c, _d;
    const metadata = ((_a = row.metadata) !== null && _a !== void 0 ? _a : {});
    return {
        id: row.id,
        tenantId: row.tenant_id,
        planId: (_b = metadata.plan_id) !== null && _b !== void 0 ? _b : null,
        status: row.status,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        stripeCustomerId: (_c = metadata.stripe_customer_id) !== null && _c !== void 0 ? _c : null,
        stripeSubscriptionId: (_d = metadata.stripe_subscription_id) !== null && _d !== void 0 ? _d : null,
        metadata,
    };
}
function toInvoice(row) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return {
        id: row.id,
        tenantId: row.tenant_id,
        amount: (_b = (_a = row.amount_cents) !== null && _a !== void 0 ? _a : row.total_cents) !== null && _b !== void 0 ? _b : 0,
        status: row.status,
        periodStart: (_d = (_c = row.metadata) === null || _c === void 0 ? void 0 : _c.period_start) !== null && _d !== void 0 ? _d : null,
        periodEnd: (_f = (_e = row.metadata) === null || _e === void 0 ? void 0 : _e.period_end) !== null && _f !== void 0 ? _f : null,
        lineItems: (_h = (_g = row.metadata) === null || _g === void 0 ? void 0 : _g.line_items) !== null && _h !== void 0 ? _h : [],
        stripeInvoiceId: (_k = (_j = row.metadata) === null || _j === void 0 ? void 0 : _j.stripe_invoice_id) !== null && _k !== void 0 ? _k : null,
    };
}
export async function listPlans(tenantId) {
    const rows = await listPlansData(tenantId, { activeOnly: true, limit: 100 });
    return rows.map(toPlan);
}
export async function getPlan(tenantId, planId) {
    const row = await getPlanById(tenantId, planId);
    return row ? toPlan(row) : null;
}
export async function createSubscription(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const plan = await getPlan(input.tenantId, input.planId);
    if (!plan)
        throw new Error("PLAN_NOT_FOUND");
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + (input.billingCycle === "yearly" ? 12 : 1));
    const stripeCustomer = await ensureStripeCustomer(input.tenantId);
    const row = await createSubscriptionData(input.tenantId, {
        plan_id: input.planId,
        billing_plan_id: (_a = plan.billingPlanId) !== null && _a !== void 0 ? _a : null,
        family_id: (_b = input.familyId) !== null && _b !== void 0 ? _b : null,
        student_id: (_c = input.studentId) !== null && _c !== void 0 ? _c : null,
        status: "active",
        start_date: now.toISOString().slice(0, 10),
        current_period_start: now.toISOString().slice(0, 10),
        current_period_end: periodEnd.toISOString().slice(0, 10),
        next_invoice_at: periodEnd.toISOString(),
        metadata: {
            plan_id: plan.id,
            billing_cycle: (_d = input.billingCycle) !== null && _d !== void 0 ? _d : "monthly",
            stripe_customer_id: (_e = stripeCustomer === null || stripeCustomer === void 0 ? void 0 : stripeCustomer.id) !== null && _e !== void 0 ? _e : null,
        },
    });
    const sub = toSubscription(row);
    await syncStripeSubscription({
        tenantId: input.tenantId,
        subscriptionId: row.id,
        customerId: (_f = stripeCustomer === null || stripeCustomer === void 0 ? void 0 : stripeCustomer.id) !== null && _f !== void 0 ? _f : null,
        plan,
        billingCycle: (_g = input.billingCycle) !== null && _g !== void 0 ? _g : "monthly",
    }).catch(() => null);
    return sub;
}
export async function updateSubscription(input) {
    var _a;
    const patch = {};
    if (input.status)
        patch.status = input.status;
    if (input.planId !== undefined) {
        patch.metadata = { plan_id: input.planId };
    }
    const row = await updateSubscriptionData(input.subscriptionId, input.tenantId, patch);
    const next = toSubscription(row);
    await syncStripeSubscription({
        tenantId: input.tenantId,
        subscriptionId: row.id,
        customerId: (_a = next.stripeCustomerId) !== null && _a !== void 0 ? _a : null,
        plan: input.planId ? await getPlan(input.tenantId, input.planId) : null,
        status: row.status,
    }).catch(() => null);
    return next;
}
export async function listTenantSubscriptions(tenantId) {
    const rows = await listSubscriptionsData(tenantId, undefined, { limit: 200 });
    return rows.map(toSubscription);
}
export async function recordUsage(input) {
    var _a, _b;
    const row = await recordUsageData(input.tenantId, {
        metric: input.metric,
        amount: input.amount,
        source: (_a = input.source) !== null && _a !== void 0 ? _a : "system",
        metadata: (_b = input.metadata) !== null && _b !== void 0 ? _b : {},
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
function lineItemsFromUsage(usage) {
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
export async function generateInvoice(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const usage = await listUsageRecords(input.tenantId, { from: input.period.start, to: input.period.end }, { limit: 5000 });
    const lineItems = lineItemsFromUsage(usage);
    const invoice = await createInvoiceService(input.tenantId, {
        subscription_id: (_a = input.subscriptionId) !== null && _a !== void 0 ? _a : null,
        family_id: (_b = input.familyId) !== null && _b !== void 0 ? _b : null,
        student_id: (_c = input.studentId) !== null && _c !== void 0 ? _c : null,
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
        metadata: Object.assign(Object.assign({}, ((_d = invoice.metadata) !== null && _d !== void 0 ? _d : {})), { period_start: input.period.start, period_end: input.period.end, line_items: lineItems }),
    });
    await syncStripeInvoice({
        tenantId: input.tenantId,
        invoiceId: invoice.id,
        amountCents: (_f = (_e = invoice.total_cents) !== null && _e !== void 0 ? _e : invoice.amount_cents) !== null && _f !== void 0 ? _f : 0,
    }).catch(() => null);
    return {
        id: invoice.id,
        tenantId: invoice.tenant_id,
        amount: (_h = (_g = invoice.total_cents) !== null && _g !== void 0 ? _g : invoice.amount_cents) !== null && _h !== void 0 ? _h : 0,
        status: invoice.status,
        periodStart: input.period.start,
        periodEnd: input.period.end,
        lineItems: lineItems,
    };
}
export async function listInvoices(tenantId) {
    const rows = await listInvoicesData(tenantId, undefined, { limit: 200 });
    return rows.map(toInvoice);
}
export async function getUsageBreakdown(tenantId, period) {
    var _a;
    const rows = await listUsageRecords(tenantId, { from: period.start, to: period.end }, { limit: 5000 });
    const map = new Map();
    for (const row of rows) {
        map.set(row.metric, ((_a = map.get(row.metric)) !== null && _a !== void 0 ? _a : 0) + Number(row.amount));
    }
    return Array.from(map.entries())
        .map(([metric, total]) => ({ metric, total }))
        .sort((a, b) => b.total - a.total);
}

import "server-only";
import { createSubscription as dataCreateSubscription, getSubscriptionById, listSubscriptions as dataListSubscriptions, updateSubscription as dataUpdateSubscription, } from "@data/subscriptions";
import { getBillingPlanById, } from "@data/billingPlans";
import { createInvoice as createInvoiceService } from "./invoiceQueries";
function addInterval(from, interval, count) {
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
export async function listSubscriptions(tenantId, filter, opts) {
    return dataListSubscriptions(tenantId, filter, opts);
}
export async function getSubscription(tenantId, id) {
    return getSubscriptionById(id, tenantId);
}
export async function createSubscription(tenantId, input) {
    var _a;
    const start = (_a = input.start_date) !== null && _a !== void 0 ? _a : new Date().toISOString().slice(0, 10);
    const plan = input.billing_plan_id
        ? await getBillingPlanById(input.billing_plan_id, tenantId)
        : null;
    const periodStart = new Date(start);
    const periodEnd = plan
        ? addInterval(periodStart, plan.interval, plan.interval_count)
        : addInterval(periodStart, "month", 1);
    return dataCreateSubscription(tenantId, Object.assign(Object.assign({}, input), { start_date: start, current_period_start: periodStart.toISOString().slice(0, 10), current_period_end: periodEnd.toISOString().slice(0, 10), next_invoice_at: periodStart.toISOString() }));
}
export async function updateSubscription(tenantId, id, patch) {
    return dataUpdateSubscription(id, tenantId, patch);
}
export async function cancelSubscription(tenantId, id, reason, cancelAt) {
    const now = new Date().toISOString();
    return dataUpdateSubscription(id, tenantId, {
        status: "cancelled",
        cancelled_at: now,
        cancel_at: cancelAt !== null && cancelAt !== void 0 ? cancelAt : now,
        cancel_reason: reason !== null && reason !== void 0 ? reason : null,
    });
}
export async function generateRecurringInvoices(tenantId, opts) {
    var _a, _b;
    const now = (_a = opts === null || opts === void 0 ? void 0 : opts.now) !== null && _a !== void 0 ? _a : new Date();
    const horizon = now.toISOString();
    const candidates = await dataListSubscriptions(tenantId, { status: "active", due_before: horizon }, { limit: (_b = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _b !== void 0 ? _b : 100, orderBy: "next_invoice_at", ascending: true });
    const results = [];
    for (const sub of candidates) {
        if (!sub.next_invoice_at)
            continue;
        const plan = sub.billing_plan_id
            ? await getBillingPlanById(sub.billing_plan_id, tenantId)
            : null;
        if (!plan)
            continue;
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
async function invoiceForPlan(tenantId, sub, plan) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const qty = (_a = sub.quantity) !== null && _a !== void 0 ? _a : 1;
    const lineItems = [];
    const base = (_c = (_b = sub.price_override_cents) !== null && _b !== void 0 ? _b : plan.base_price_cents) !== null && _c !== void 0 ? _c : 0;
    switch (plan.kind) {
        case "hourly":
            lineItems.push({
                invoice_id: "",
                description: `${plan.name} — ${(_d = plan.unit_label) !== null && _d !== void 0 ? _d : "hour"}`,
                quantity: qty,
                unit_amount_cents: (_e = plan.per_unit_price_cents) !== null && _e !== void 0 ? _e : base,
                amount_cents: Math.round(((_f = plan.per_unit_price_cents) !== null && _f !== void 0 ? _f : base) * qty),
                taxable: plan.tax_rate_bp > 0,
                kind: "session",
            });
            break;
        case "per_lesson":
            lineItems.push({
                invoice_id: "",
                description: `${plan.name} — lesson`,
                quantity: qty,
                unit_amount_cents: (_g = plan.per_unit_price_cents) !== null && _g !== void 0 ? _g : base,
                amount_cents: Math.round(((_h = plan.per_unit_price_cents) !== null && _h !== void 0 ? _h : base) * qty),
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
            if (plan.per_unit_price_cents && qty > ((_j = plan.included_units) !== null && _j !== void 0 ? _j : 0)) {
                const overage = qty - ((_k = plan.included_units) !== null && _k !== void 0 ? _k : 0);
                lineItems.push({
                    invoice_id: "",
                    description: `${plan.name} — ${(_l = plan.unit_label) !== null && _l !== void 0 ? _l : "unit"} overage`,
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
